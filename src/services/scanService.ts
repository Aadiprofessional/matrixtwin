import { pdfjs } from 'react-pdf';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';

// Ensure worker is set
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ScanResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const processAndScanDocument = async (
  file: File, 
  userId: string
): Promise<ScanResponse> => {
  try {
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    // 1. Upload original file to Supabase
    const documentPath = `users/${userId}/documents/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(documentPath, file);

    if (uploadError) {
      throw new Error(`Failed to upload document: ${uploadError.message}`);
    }

    const { data: { publicUrl: documentUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(documentPath);

    // 2. Convert PDF pages to images
    const imageUrls: string[] = [];
    let numPages = 0;

    if (file.type === 'application/pdf') {
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument(fileArrayBuffer);
      const pdf = await loadingTask.promise;
      numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          const renderContext: any = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
          
          // Convert canvas to blob
          const blob = await new Promise<Blob | null>((resolve) => 
            canvas.toBlob(resolve, 'image/png')
          );

          if (blob) {
            const imageName = `${uniqueId}_page_${i}.png`;
            const imagePath = `users/${userId}/images/${imageName}`;
            
            const { error: imageUploadError } = await supabase.storage
              .from('user-uploads')
              .upload(imagePath, blob);

            if (imageUploadError) {
              console.error(`Failed to upload page ${i}:`, imageUploadError);
              continue;
            }

            const { data: { publicUrl: imageUrl } } = supabase.storage
              .from('user-uploads')
              .getPublicUrl(imagePath);
              
            imageUrls.push(imageUrl);
          }
        }
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      // Handle DOCX conversion using docx-preview and html2canvas
      try {
        const fileArrayBuffer = await file.arrayBuffer();
        
        // Create a hidden container for rendering
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '800px'; // Standard A4 width approx
        container.style.backgroundColor = 'white';
        // Ensure container is in the DOM so it renders
        document.body.appendChild(container);

        // Render DOCX
        // @ts-ignore - docx-preview types might not be perfect
        await renderAsync(fileArrayBuffer, container, null, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          experimental: true,
          useBase64URL: true // Embed images as base64 to avoid CORS issues in html2canvas
        });

        // Wait a bit for layout to settle (sometimes images load async)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Find pages (docx-preview creates sections for pages if breakPages is true)
        // Usually .docx-wrapper > section.docx
        const pages = container.querySelectorAll('.docx-wrapper > section');
        
        if (pages.length > 0) {
           numPages = pages.length;
           for (let i = 0; i < pages.length; i++) {
             const pageElement = pages[i] as HTMLElement;
             const canvas = await html2canvas(pageElement, { 
               scale: 1.5, // slightly lower scale to save memory/time
               useCORS: true,
               logging: false
             });
             const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
             
             if (blob) {
                const imageName = `${uniqueId}_page_${i + 1}.png`;
                const imagePath = `users/${userId}/images/${imageName}`;
                
                const { error: imageUploadError } = await supabase.storage
                  .from('user-uploads')
                  .upload(imagePath, blob);

                if (imageUploadError) {
                   console.error(`Failed to upload page ${i + 1}:`, imageUploadError);
                } else {
                  const { data: { publicUrl: imageUrl } } = supabase.storage
                    .from('user-uploads')
                    .getPublicUrl(imagePath);
                  imageUrls.push(imageUrl);
                }
             }
           }
        } else {
           // Fallback: capture the whole container content
           // Sometimes docx-preview just puts content directly in container
           const canvas = await html2canvas(container, { 
             scale: 1.5,
             useCORS: true,
             logging: false
           });
           const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
           
           if (blob) {
             numPages = 1;
             const imageName = `${uniqueId}_page_1.png`;
             const imagePath = `users/${userId}/images/${imageName}`;
             
             const { error: imageUploadError } = await supabase.storage
               .from('user-uploads')
               .upload(imagePath, blob);

             if (imageUploadError) {
                console.error('Failed to upload docx image:', imageUploadError);
             } else {
                const { data: { publicUrl: imageUrl } } = supabase.storage
                  .from('user-uploads')
                  .getPublicUrl(imagePath);
                imageUrls.push(imageUrl);
             }
           }
        }

        // Cleanup
        document.body.removeChild(container);

      } catch (err) {
        console.error('Error converting DOCX to image:', err);
        // Don't fail the whole process, just log error
      }
    } else {
      // For non-PDF/DOCX files
      console.warn('Image preview generation skipped for non-PDF/DOCX file');
    }

    // 3. Construct payload
    const payload = {
      messages: [
        {
          uid: userId,
          role: "user",
          roleDescription: "User uploaded document",
          timestamp: new Date().toISOString(),
          url: documentUrl,
          image_urls: imageUrls,
          page_count: numPages || 1
        }
      ],
      stream: true
    };

    // 4. Call Webhook
    const response = await fetch('https://n8n.matrixaiserver.com/webhook/matrixTwin/AIScan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // If parsing fails and response was not OK, throw error with text
      if (!response.ok) {
        throw new Error(`Webhook call failed (${response.status}): ${responseText.substring(0, 200)}`);
      }
      // If parsing fails but response was OK, treat as text message
      responseData = { message: responseText };
    }

    // If response was not OK, check if we have usable data
    if (!response.ok) {
       console.warn('Webhook returned error status:', response.status, responseData);
       
       // Heuristic: if it looks like the expected data structure (not just a simple error message)
       // The expected data usually contains "output", "pages", "widgets" or is an array of widgets
       const isSimpleError = responseData && responseData.message && Object.keys(responseData).length <= 2;
       const hasDataLikeStructure = responseData && (
         responseData.output || 
         responseData.pages || 
         responseData.widgets || 
         Array.isArray(responseData) ||
         (typeof responseData === 'object' && Object.keys(responseData).length > 2)
       );

       if (isSimpleError || !hasDataLikeStructure) {
          throw new Error(`Webhook call failed (${response.status}): ${responseData?.message || response.statusText}`);
       }
       
       console.log('Treating 500 response as success because it contains valid data structure');
    }

    return {
      success: true,
      data: responseData
    };

  } catch (error: any) {
    console.error('Error in processAndScanDocument:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

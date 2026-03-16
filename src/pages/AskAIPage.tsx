import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCloseCircleLine,
  RiBrainLine,
  RiAddLine,
  RiHistoryLine,
  RiSendPlaneFill,
  RiDeleteBinLine,
  RiUpload2Line,
  RiSearchLine,
  RiFileCopyLine,
  RiShareLine,
  RiDownload2Line,
  RiLinksLine,
  RiFileExcel2Line,
  RiFileWord2Line,
  RiFileLine,
  RiExternalLinkLine
} from 'react-icons/ri';
import { IconContext } from 'react-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';

import { useProjects } from '../contexts/ProjectContext';
import { useAIChat, Message as ChatMessage } from '../contexts/AIChatContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { ChartBlock } from '../components/ai/ChartBlock';
import { AIFormLink } from '../components/ai/AIFormLink';

const extractLinkUrls = (content: string): string[] => {
  const blockRegex = /```linkurl\s*([\s\S]*?)```/gi;
  const urls: string[] = [];
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRegex.exec(content)) !== null) {
    const block = blockMatch[1] || '';
    const urlRegex = /(https?:\/\/[^\s`"']+)/g;
    let urlMatch: RegExpExecArray | null;
    while ((urlMatch = urlRegex.exec(block)) !== null) {
      urls.push(urlMatch[1]);
    }
  }
  return Array.from(new Set(urls));
};

const stripLinkUrlBlocks = (content: string): string => {
  return content.replace(/```linkurl\s*[\s\S]*?```/gi, '').trim();
};

type GeneratedFileType = 'xlsx' | 'docx';

interface GeneratedFileAttachment {
  url: string;
  fileType: GeneratedFileType;
  fileName: string;
}

const extractTextFromJsonPayload = (payload: unknown): string | null => {
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) return payload;
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsedNested = JSON.parse(trimmed);
        return extractTextFromJsonPayload(parsedNested);
      } catch (error) {
        return payload;
      }
    }
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const extracted = extractTextFromJsonPayload(item);
      if (typeof extracted === 'string' && extracted.trim()) {
        return extracted;
      }
    }
    return null;
  }

  if (payload && typeof payload === 'object') {
    const typedPayload = payload as Record<string, unknown>;
    const keys: Array<'output' | 'response' | 'text' | 'content' | 'message'> = [
      'output',
      'response',
      'text',
      'content',
      'message'
    ];
    for (const key of keys) {
      const value = typedPayload[key];
      const extracted = extractTextFromJsonPayload(value);
      if (typeof extracted === 'string' && extracted.trim()) {
        return extracted;
      }
    }
  }

  return null;
};

const normalizePotentialJsonMessage = (content: string): string => {
  const trimmed = content.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = JSON.parse(trimmed);
    const extracted = extractTextFromJsonPayload(parsed);
    if (typeof extracted === 'string') {
      return extracted;
    }
  } catch (error) {
    return content;
  }

  return content;
};

const cleanExtractedUrl = (url: string): string => {
  return url.replace(/[),.;!?]+$/g, '');
};

const extractAllUrls = (content: string): string[] => {
  const normalized = normalizePotentialJsonMessage(content);
  const urls: string[] = [];
  const urlRegex = /(https?:\/\/[^\s<>"'`)\]}]+)/gi;
  const markdownRegex = /\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(normalized)) !== null) {
    urls.push(cleanExtractedUrl(match[1]));
  }

  while ((match = markdownRegex.exec(normalized)) !== null) {
    urls.push(cleanExtractedUrl(match[1]));
  }

  extractLinkUrls(content).forEach((url) => urls.push(cleanExtractedUrl(url)));

  return Array.from(new Set(urls));
};

const resolveGeneratedFileType = (url: string): GeneratedFileType | null => {
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  if (path.endsWith('.xlsx') || path.endsWith('.xls')) {
    return 'xlsx';
  }
  if (path.endsWith('.docx') || path.endsWith('.doc')) {
    return 'docx';
  }
  return null;
};

const getFileNameFromUrl = (url: string): string => {
  const withoutQuery = url.split('?')[0];
  const rawName = withoutQuery.split('/').pop() || '';
  try {
    return decodeURIComponent(rawName) || 'generated-file';
  } catch (error) {
    return rawName || 'generated-file';
  }
};

const extractGeneratedFileAttachments = (content: string): GeneratedFileAttachment[] => {
  const urls = extractAllUrls(content);
  return urls
    .map((url) => {
      const fileType = resolveGeneratedFileType(url);
      if (!fileType) return null;
      return {
        url,
        fileType,
        fileName: getFileNameFromUrl(url)
      };
    })
    .filter((item): item is GeneratedFileAttachment => item !== null);
};

const removeGeneratedFileUrlsFromText = (content: string): string => {
  return content
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s<>"'`]+?\.(?:xlsx|xls|docx|doc)(?:\?[^\s<>"'`]*)?(?:#[^\s<>"'`]*)?)\)/gi,
      '$1'
    )
    .replace(/`?(https?:\/\/[^\s<>"'`]+?\.(?:xlsx|xls|docx|doc)(?:\?[^\s<>"'`]*)?(?:#[^\s<>"'`]*)?)`?/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const TableWithActions: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tableRef = useRef<HTMLDivElement>(null);

  const exportPng = async (): Promise<Blob | null> => {
    if (!tableRef.current) return null;
    const canvas = await html2canvas(tableRef.current, { backgroundColor: '#111827', scale: 2, useCORS: true });
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const onDownload = async () => {
    const blob = await exportPng();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `table-${Date.now()}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onShare = async () => {
    const blob = await exportPng();
    if (!blob) return;
    const file = new File([blob], `table-${Date.now()}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Table Snapshot' });
      return;
    }
    const url = URL.createObjectURL(blob);
    await navigator.clipboard.writeText(url);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="my-4">
      <div className="mb-2 flex items-center justify-end gap-2">
        <button onClick={onDownload} className="text-xs px-2 py-1 rounded border border-white/15 text-gray-300 hover:bg-white/10 inline-flex items-center gap-1">
          <RiDownload2Line />
          Download
        </button>
        <button onClick={onShare} className="text-xs px-2 py-1 rounded border border-white/15 text-gray-300 hover:bg-white/10 inline-flex items-center gap-1">
          <RiShareLine />
          Share
        </button>
      </div>
      <div ref={tableRef}>{children}</div>
    </div>
  );
};

const MemoChartMarkdownBlock = React.memo(({ content }: { content: string }) => {
  const parsedConfig = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }, [content]);

  if (!parsedConfig) {
    return (
      <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-portfolio-orange">
        {content}
      </code>
    );
  }

  return <ChartBlock config={parsedConfig} />;
});

const MemoFormsMarkdownBlock = React.memo(({ content }: { content: string }) => {
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }, [content]);

  if (!parsedData || !parsedData.forms || !Array.isArray(parsedData.forms)) {
    return null;
  }

  return <AIFormLink forms={parsedData.forms} />;
});

const markdownComponents: any = {
  h1: (props: any) => <h1 className="text-2xl font-bold text-white mt-6 mb-4 pb-2 border-b border-white/10" {...props} />,
  h2: (props: any) => <h2 className="text-xl font-bold text-white mt-5 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-lg font-semibold text-portfolio-orange mt-4 mb-2" {...props} />,
  h4: (props: any) => <h4 className="text-base font-semibold text-white mt-3 mb-2" {...props} />,
  p: (props: any) => <p className="mb-3 leading-relaxed text-gray-300 last:mb-0 whitespace-pre-wrap" {...props} />,
  a: (props: any) => <a className="text-portfolio-orange hover:text-white underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-300" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-gray-300" {...props} />,
  li: (props: any) => <li className="pl-1" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-portfolio-orange/50 pl-4 py-1 my-4 bg-white/5 rounded-r italic text-gray-400" {...props} />,
  hr: (props: any) => <hr className="border-white/10 my-6" {...props} />,
  table: (props: any) => (
    <TableWithActions>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full divide-y divide-white/10" {...props} />
      </div>
    </TableWithActions>
  ),
  thead: (props: any) => <thead className="bg-white/5" {...props} />,
  th: (props: any) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-white/5 bg-transparent" {...props} />,
  tr: (props: any) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
  td: (props: any) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300" {...props} />,
  code: ({ className, children, ...props }: any) => {
    const match = /language-([\w-]+)/.exec(className || '');
    const language = match ? match[1] : '';
    const contentStr = String(children).replace(/\n$/, '');
    
    if (language === 'chartjs') {
      return <MemoChartMarkdownBlock content={contentStr} />;
    }

    if (language === 'forms-json') {
      return <MemoFormsMarkdownBlock content={contentStr} />;
    }

    return match ? (
      <div className="rounded-lg bg-[#1e1e1e] my-4 overflow-hidden border border-white/10 shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
          <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <code className={`${className} font-mono text-sm`} {...props}>
            {children}
          </code>
        </div>
      </div>
    ) : (
      <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-portfolio-orange" {...props}>
        {children}
      </code>
    );
  },
  pre: (props: any) => <pre className="bg-transparent p-0 m-0" {...props} />,
  img: (props: any) => <img className="rounded-lg max-w-full h-auto my-4 border border-white/10" {...props} alt={props.alt || 'AI generated image'} />,
};

// Helper component to render message content with mixed types (Text, Chart, Forms)
const MessageContentRenderer: React.FC<{ message: ChatMessage }> = React.memo(({ message }) => {
  const isUserMessage = message.sender === 'user';

  const content = useMemo(() => {
    if (isUserMessage) {
      return message.content;
    }

    let normalizedContent = normalizePotentialJsonMessage(stripLinkUrlBlocks(message.content))
      .replace(/`(https?:\/\/[^`\s]+)`/gi, '[$1]($1)')
      .replace(
        /<!--FORMS_JSON_START-->([\s\S]*?)<!--FORMS_JSON_END-->/g,
        '\n```forms-json\n$1\n```\n'
      )
      .replace(/```\s*chartjs/gi, '\n```chartjs')
      .replace(/([^\n])```/g, '$1\n```');

    normalizedContent = removeGeneratedFileUrlsFromText(normalizedContent);

    if (message.isStreaming) {
      normalizedContent += ' ▍';
    }

    return normalizedContent;
  }, [isUserMessage, message.content, message.isStreaming]);

  if (isUserMessage) {
    return <>{message.content}</>;
  }

  return (
    <div className="markdown-container w-full max-w-full min-w-0 break-words overflow-x-hidden">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}, (prevProps, nextProps) => (
  prevProps.message === nextProps.message ||
  (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isStreaming === nextProps.message.isStreaming &&
    prevProps.message.sender === nextProps.message.sender
  )
));

const AskAIPage: React.FC = () => {
  const { t } = useTranslation();
  const { selectedProject } = useProjects();
  const { 
    currentChat, 
    chatHistory, 
    sendMessage,
    startNewChat,
    deleteChat,
    switchToChat,
    getProjectChats
  } = useAIChat();
  
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUploadMode, setSelectedUploadMode] = useState<'image' | 'document' | 'pdf_vision' | null>(null);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [activeReasoningId, setActiveReasoningId] = useState<string | null>(null);
  const [activeLinksMessageId, setActiveLinksMessageId] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<'docx' | 'xlsx' | null>(null);
  const [previewFile, setPreviewFile] = useState<GeneratedFileAttachment | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const pdfVisionInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat.messages]);

  // Switch to project-specific chat when project changes
  useEffect(() => {
    if (selectedProject?.id) {
      // If current chat is not for this project, switch or create new
      if (currentChat.projectId !== String(selectedProject.id)) {
        const projectChats = getProjectChats(String(selectedProject.id));
        if (projectChats.length > 0) {
          // Switch to the most recent chat for this project
          const latestChat = [...projectChats].sort((a, b) => 
            new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
          )[0];
          switchToChat(latestChat.id);
        } else {
          // Create new chat for this project
          startNewChat(String(selectedProject.id));
        }
      }
    }
  }, [selectedProject?.id, currentChat.projectId, getProjectChats, switchToChat, startNewChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText: string = input) => {
    if (generationType && !messageText.trim()) return;
    if (!messageText.trim() && !selectedFile) return;
    const fileToSend = selectedFile;
    const mode = generationType || (isSearchEnabled && !fileToSend ? 'search' : 'text');
    const uploadMode = fileToSend ? selectedUploadMode || (fileToSend.type.startsWith('image/') ? 'image' : 'document') : undefined;
    setInput('');
    setSelectedFile(null);
    setSelectedUploadMode(null);
    setIsSearchEnabled(false);
    setGenerationType(null);
    
    try {
      await sendMessage(messageText, selectedProject?.id, { mode, file: fileToSend, uploadMode });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    startNewChat(selectedProject?.id ? String(selectedProject.id) : undefined);
    setInput('');
    setSelectedFile(null);
    setSelectedUploadMode(null);
    setIsSearchEnabled(false);
    setGenerationType(null);
    setShowChatHistory(false);
  };

  const handleFileSelected = (file: File | null, uploadMode: 'image' | 'document' | 'pdf_vision') => {
    setSelectedFile(file);
    setSelectedUploadMode(file ? uploadMode : null);
    setIsSearchEnabled(false);
    setGenerationType(null);
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileSelected(file, 'image');
    event.target.value = '';
  };

  const handleDocumentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileSelected(file, 'document');
    event.target.value = '';
  };

  const handlePdfVisionFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileSelected(file, 'pdf_vision');
    event.target.value = '';
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
  };

  const openImagePicker = () => {
    setShowUploadModal(false);
    imageInputRef.current?.click();
  };

  const openDocumentPicker = () => {
    setShowUploadModal(false);
    documentInputRef.current?.click();
  };

  const openPdfVisionPicker = () => {
    setShowUploadModal(false);
    pdfVisionInputRef.current?.click();
  };
  
  const toggleChatHistory = () => {
    setShowChatHistory(!showChatHistory);
  };
  
  const handleChatSelect = (chatId: string) => {
    switchToChat(chatId);
    setShowChatHistory(false);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm(t('askAI.confirmDelete', 'Are you sure you want to delete this chat?'))) {
      await deleteChat(chatId);
    }
  };

  const copyMessage = async (content: string) => {
    const clean = normalizePotentialJsonMessage(stripLinkUrlBlocks(content));
    await navigator.clipboard.writeText(clean);
  };

  const shareMessage = async (content: string) => {
    const clean = normalizePotentialJsonMessage(stripLinkUrlBlocks(content));
    if (navigator.share) {
      try {
        await navigator.share({ text: clean, title: 'MatrixTwin AI' });
        return;
      } catch (error) {
        await navigator.clipboard.writeText(clean);
        return;
      }
    }
    await navigator.clipboard.writeText(clean);
  };

  const toggleReasoning = (messageId: string) => {
    setActiveReasoningId(activeReasoningId === messageId ? null : messageId);
  };

  const filteredHistory = selectedProject?.id 
    ? getProjectChats(String(selectedProject.id))
    : chatHistory;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] relative -mx-6">
      {/* Background decorations - Subtle Orange Theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-portfolio-orange/5 via-transparent to-transparent opacity-20 pointer-events-none"></div>
      
      {/* Fixed Layout with 3 sections: Header, Scrollable Chat, Footer */}
      <div className="flex flex-col h-full z-10">
        {/* Fixed Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-6 border-b border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-portfolio-orange/10 flex items-center justify-center border border-portfolio-orange/20">
              <IconContext.Provider value={{ className: "text-portfolio-orange text-xl" }}>
                <RiBrainLine />
              </IconContext.Provider>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-display font-bold text-white leading-none">
                MatrixTwin AI
              </h1>
              <div className="text-gray-400 text-xs flex items-center mt-1">
                <span>{t('askAI.subtitle', 'Ask anything about your projects')}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 self-end sm:self-auto mt-2 sm:mt-0">
            <Button
              onClick={handleNewChat}
              size="sm"
              className="rounded-lg bg-portfolio-orange hover:bg-portfolio-orange/80 text-white border-none"
            >
              <RiAddLine className="mr-1" />
              New Chat
            </Button>
            
            <Button
              onClick={toggleChatHistory}
              variant="outline"
              size="sm"
              className="rounded-lg border-white/10 text-gray-300 hover:bg-white/5"
            >
              <RiHistoryLine className="mr-1" />
              History
            </Button>
            
          </div>
        </div>
        
        {/* Chat History Drawer - Right Panel with Backdrop */}
        <AnimatePresence>
          {showChatHistory && (
            <>
              {/* Backdrop for click-outside to close */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleChatHistory}
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              />
              
              {/* Right Side Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 z-50 w-80 h-full shadow-2xl"
              >
                <Card variant="ai-dark" className="p-0 h-full flex flex-col border-l border-white/10 bg-black/90 backdrop-blur-xl">
                  <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40">
                    <h3 className="text-sm font-display font-semibold flex items-center text-white">
                      <IconContext.Provider value={{ className: "mr-2 text-portfolio-orange" }}>
                        <RiHistoryLine />
                      </IconContext.Provider>
                      Chat History
                    </h3>
                    <button 
                      onClick={toggleChatHistory}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <RiCloseCircleLine className="text-xl" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-10 text-gray-500 text-sm">
                        No history found
                      </div>
                    ) : (
                      filteredHistory.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => handleChatSelect(chat.id)}
                          className={`group w-full text-left p-3 rounded-md transition-all text-sm cursor-pointer relative flex items-center justify-between ${
                            currentChat.id === chat.id
                              ? 'bg-portfolio-orange/10 border border-portfolio-orange/30 text-white'
                              : 'hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center overflow-hidden flex-1 mr-2">
                            <div className="overflow-hidden w-full">
                              <div className="font-medium truncate pr-1">{chat.title}</div>
                              <div className="text-[10px] text-gray-600 mt-1 flex items-center justify-between">
                                <span>{new Date(chat.lastUpdatedAt).toLocaleDateString()}</span>
                                <span className="text-xs opacity-60">{new Date(chat.lastUpdatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                            className="text-gray-500 hover:text-red-500 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                            title="Delete chat"
                          >
                            <RiDeleteBinLine />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Main Chat Area - Middle section with scrollable content */}
        <div className="flex-grow overflow-hidden flex flex-col relative">
          {/* Only this area should scroll */}
          <div className="flex-grow overflow-y-auto py-4 px-4 ai-scrollbar">
            <div className="space-y-6 w-full">
              {currentChat.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 mt-10">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <RiBrainLine className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-300">How can I help you today?</h3>
                  <p className="text-sm max-w-md mt-2">
                    Ask me about your project status, tasks, safety reports, or any other construction details.
                  </p>
                </div>
              )}
              
              {currentChat.messages.map((message) => {
                const messageReasoning = window.sessionStorage.getItem(`reasoning-${message.id}`);
                const isReasoningActive = activeReasoningId === message.id;
                const links = message.sender === 'ai' ? extractLinkUrls(message.content) : [];
                const generatedFiles = message.sender === 'ai' ? extractGeneratedFileAttachments(message.content) : [];
                const isLinksPanelOpen = activeLinksMessageId === message.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex ${
                        message.sender === 'user'
                          ? 'items-end max-w-[90%] sm:max-w-[85%] flex-col'
                          : 'w-[70vw] max-w-[70vw] min-w-0 flex-col'
                      }`}
                    >
                      {message.sender !== 'user' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                            message.isStreaming
                              ? 'bg-portfolio-orange text-white animate-pulse'
                              : 'bg-transparent text-portfolio-orange border border-white/10'
                          }`}>
                            <IconContext.Provider value={{ className: "text-base" }}>
                              <RiBrainLine />
                            </IconContext.Provider>
                          </div>
                          <span className="text-lg font-bold text-white leading-none">
                            MatrixTwin AI
                          </span>
                        </div>
                      )}
                      
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        message.sender === 'user'
                          ? 'bg-portfolio-orange text-white shadow-md rounded-tr-none'
                          : 'bg-transparent text-gray-200 pl-0 pt-0 border-none shadow-none w-full'
                      }`}>
                        {/* Display uploaded image in user message */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={`${attachment.url}-${index}`} className="rounded-lg overflow-hidden border border-white/15 bg-black/30">
                                {attachment.fileType === 'image' ? (
                                  <img
                                    src={attachment.url}
                                    alt={attachment.originalName}
                                    className="max-w-full h-auto max-h-60 object-contain bg-black/50"
                                  />
                                ) : (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-3 py-2 text-xs text-white/90 hover:text-white hover:bg-white/5 transition-colors break-all"
                                  >
                                    {attachment.originalName}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {(!message.attachments || message.attachments.length === 0) && message.imageUrl && (
                          <div className="mb-3 rounded-lg overflow-hidden">
                            <img 
                              src={message.imageUrl} 
                              alt="Uploaded" 
                              className="max-w-full h-auto max-h-60 object-contain bg-black/50"
                            />
                          </div>
                        )}
                        
                        <div className={`w-full ${message.sender === 'user' ? 'text-white' : 'text-gray-200'} leading-relaxed`}>
                          <MessageContentRenderer message={message} />
                          {message.isStreaming && message.content === '' && (
                            <div className="flex items-center text-portfolio-orange py-1">
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                <div className="w-1.5 h-1.5 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                              </div>
                            </div>
                          )}
                        </div>
                        {message.sender === 'ai' && generatedFiles.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {generatedFiles.map((file, fileIndex) => (
                              <button
                                key={`${message.id}-generated-file-${fileIndex}`}
                                onClick={() => setPreviewFile(file)}
                                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                              >
                                <span className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-2 min-w-0">
                                    {file.fileType === 'xlsx' ? (
                                      <RiFileExcel2Line className="text-portfolio-orange text-base flex-shrink-0" />
                                    ) : file.fileType === 'docx' ? (
                                      <RiFileWord2Line className="text-portfolio-orange text-base flex-shrink-0" />
                                    ) : (
                                      <RiFileLine className="text-portfolio-orange text-base flex-shrink-0" />
                                    )}
                                    <span className="text-xs text-white truncate">
                                      {file.fileType === 'xlsx' ? 'Attached Excel' : 'Attached Word'} · {file.fileName}
                                    </span>
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-portfolio-orange flex-shrink-0">
                                    Open
                                    <RiExternalLinkLine className="text-xs" />
                                  </span>
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {message.sender === 'ai' && (
                          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                            <span className="text-[10px] text-gray-500">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {links.length > 0 && (
                                <button
                                  onClick={() => setActiveLinksMessageId(isLinksPanelOpen ? null : message.id)}
                                  className={`w-6 h-6 rounded-full border text-[10px] inline-flex items-center justify-center ${isLinksPanelOpen ? 'border-portfolio-orange text-portfolio-orange bg-portfolio-orange/10' : 'border-white/20 text-gray-300 hover:bg-white/10'}`}
                                  title="Sources"
                                >
                                  <RiLinksLine className="text-xs" />
                                </button>
                              )}
                              <button
                                onClick={() => copyMessage(message.content)}
                                className="w-6 h-6 rounded-full border border-white/20 text-gray-300 hover:bg-white/10 inline-flex items-center justify-center"
                                title="Copy"
                              >
                                <RiFileCopyLine className="text-xs" />
                              </button>
                              <button
                                onClick={() => shareMessage(message.content)}
                                className="w-6 h-6 rounded-full border border-white/20 text-gray-300 hover:bg-white/10 inline-flex items-center justify-center"
                                title="Share"
                              >
                                <RiShareLine className="text-xs" />
                              </button>
                            </div>
                          </div>
                        )}
                        {message.sender === 'ai' && links.length > 0 && isLinksPanelOpen && (
                          <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-2 space-y-1">
                            {links.map((url, linkIndex) => (
                              <a
                                key={`${message.id}-link-${linkIndex}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-portfolio-orange hover:text-white break-all"
                              >
                                {url}
                              </a>
                            ))}
                          </div>
                        )}
                        
                        {/* Update the reasoning toggle button */}
                        {message.sender === 'ai' && messageReasoning && !message.isStreaming && (
                          <div className="mt-2 border-t border-white/10 pt-2">
                            <button 
                              onClick={() => toggleReasoning(message.id)}
                              className="text-[10px] bg-portfolio-orange/10 hover:bg-portfolio-orange/20 text-portfolio-orange rounded-full px-2 py-0.5 inline-flex items-center transition-colors border border-portfolio-orange/20"
                            >
                              <RiBrainLine className="mr-1" />
                              {isReasoningActive ? 'Hide reasoning' : 'Show reasoning'}
                            </button>
                            
                            {isReasoningActive && (
                              <div className="mt-2 p-2 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap">
                                {messageReasoning}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {message.sender === 'user' && (
                        <div className="mt-1 flex items-center justify-end gap-1.5">
                          <span className="text-[10px] text-white/70">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="w-6 h-6 rounded-full border border-white/25 text-white/80 hover:bg-white/10 hover:text-white inline-flex items-center justify-center"
                            title="Copy"
                          >
                            <RiFileCopyLine className="text-xs" />
                          </button>
                          <button
                            onClick={() => shareMessage(message.content)}
                            className="w-6 h-6 rounded-full border border-white/25 text-white/80 hover:bg-white/10 hover:text-white inline-flex items-center justify-center"
                            title="Share"
                          >
                            <RiShareLine className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Fixed Input area at bottom */}
          <div className="border-t border-white/10 py-4 px-6 bg-black/20 backdrop-blur-md flex-shrink-0">
            <div className="w-full max-w-none">
              {selectedFile && (
                <div className="mb-2 inline-flex items-center rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-gray-200 max-w-full">
                  <span className="truncate">{selectedUploadMode ? `${selectedUploadMode.toUpperCase()} · ${selectedFile.name}` : selectedFile.name}</span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setSelectedUploadMode(null);
                    }}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    <RiCloseCircleLine className="text-sm" />
                  </button>
                </div>
              )}
              {(currentChat.messages.length === 0 || isInputFocused || generationType !== null) && (
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setGenerationType('docx');
                      setIsSearchEnabled(false);
                      setSelectedFile(null);
                      setSelectedUploadMode(null);
                    }}
                    variant={generationType === 'docx' ? 'ai' : 'outline'}
                    className={`rounded-lg h-9 px-3 text-xs ${generationType === 'docx' ? 'shadow-lg shadow-portfolio-orange/30' : 'border-white/15 text-gray-300 hover:bg-white/10'}`}
                  >
                    Generate DOCX
                  </Button>
                  <Button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setGenerationType('xlsx');
                      setIsSearchEnabled(false);
                      setSelectedFile(null);
                      setSelectedUploadMode(null);
                    }}
                    variant={generationType === 'xlsx' ? 'ai' : 'outline'}
                    className={`rounded-lg h-9 px-3 text-xs ${generationType === 'xlsx' ? 'shadow-lg shadow-portfolio-orange/30' : 'border-white/15 text-gray-300 hover:bg-white/10'}`}
                  >
                    Generate XLSX
                  </Button>
                </div>
              )}
              <div className="flex items-end gap-2 bg-black/40 border border-white/10 rounded-xl p-2 transition-all">
                <input
                  ref={imageInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                />
                <input
                  ref={documentInputRef}
                  type="file"
                  className="hidden"
                  accept=".doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx"
                  onChange={handleDocumentFileSelect}
                />
                <input
                  ref={pdfVisionInputRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handlePdfVisionFileSelect}
                />
                <Button
                  onClick={openUploadModal}
                  variant="outline"
                  className="rounded-lg w-10 h-10 p-0 flex items-center justify-center border-white/15 text-gray-300 hover:bg-white/10"
                  title="Attach file"
                >
                  <RiUpload2Line className="text-base" />
                </Button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={t('askAI.inputPlaceholder', 'Ask me anything about your project...')}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none resize-none text-sm text-white placeholder-gray-500 min-h-[44px] max-h-[120px] py-2.5 px-2 scrollbar-hide"
                  rows={1}
                  style={{ height: 'auto', minHeight: '44px' }}
                />
                <Button
                  onClick={() => {
                    setGenerationType(null);
                    setIsSearchEnabled(prev => !prev);
                  }}
                  variant={isSearchEnabled ? 'ai' : 'outline'}
                  className={`rounded-lg h-10 px-3 flex items-center justify-center transition-all ${isSearchEnabled ? 'shadow-lg shadow-portfolio-orange/30' : 'border-white/15 text-gray-300 hover:bg-white/10'}`}
                  title="Search mode"
                >
                  <RiSearchLine className="mr-1" />
                  Search
                </Button>
                <Button 
                  onClick={() => handleSendMessage()}
                  className="rounded-lg w-10 h-10 p-0 flex items-center justify-center bg-portfolio-orange hover:bg-portfolio-orange/80 transition-all shadow-md text-white disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
                  disabled={generationType ? !input.trim() : (!input.trim() && !selectedFile)}
                >
                  <RiSendPlaneFill className="text-lg" />
                </Button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-600">
                  AI can make mistakes. Please verify important information.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showUploadModal && (
        <Dialog
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Choose Upload Type"
          maxWidth="420px"
        >
          <div className="space-y-3">
            <Button
              onClick={openImagePicker}
              variant="outline"
              className="w-full justify-start border-white/15 text-gray-200 hover:bg-white/10"
            >
              Image Upload
            </Button>
            <Button
              onClick={openPdfVisionPicker}
              variant="outline"
              className="w-full justify-start border-white/15 text-gray-200 hover:bg-white/10"
            >
              PDF Vision Upload
            </Button>
            <Button
              onClick={openDocumentPicker}
              variant="outline"
              className="w-full justify-start border-white/15 text-gray-200 hover:bg-white/10"
            >
              Document Upload
            </Button>
          </div>
        </Dialog>
      )}
      {previewFile && (
        <Dialog
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          title={previewFile.fileType === 'xlsx' ? 'Excel Preview' : 'Word Preview'}
          size="full"
          maxWidth="1100px"
          fullWidth
        >
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-300 break-all">
              {previewFile.fileName}
            </div>
            <div className="h-[70vh] w-full rounded-lg overflow-hidden border border-white/10 bg-black/40">
              <iframe
                title="Generated file preview"
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.url)}`}
                className="w-full h-full border-0"
              />
            </div>
            <a
              href={previewFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-portfolio-orange hover:text-white"
            >
              Open original file
              <RiExternalLinkLine className="text-xs" />
            </a>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default AskAIPage; 

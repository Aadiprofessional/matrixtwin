import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  RiBrainLine,
  RiAddLine,
  RiSendPlaneFill,
  RiFileCopyLine,
  RiShareLine,
  RiLinksLine,
  RiDownload2Line,
  RiFileExcel2Line,
  RiFileWord2Line,
  RiFileLine,
  RiExternalLinkLine,
  RiFullscreenLine,
  RiCloseLine,

} from 'react-icons/ri';
import { IconContext } from 'react-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';

import { useAIChat, Message as ChatMessage } from '../../contexts/AIChatContext';
import { useProjects } from '../../contexts/ProjectContext';
import { Button } from '../ui/Button';
import { ChartBlock } from './ChartBlock';
import { AIFormLink } from './AIFormLink';

// --- Utility functions (same as AskAIPage) ---

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
      } catch {
        return payload;
      }
    }
    return payload;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const extracted = extractTextFromJsonPayload(item);
      if (typeof extracted === 'string' && extracted.trim()) return extracted;
    }
    return null;
  }
  if (payload && typeof payload === 'object') {
    const typedPayload = payload as Record<string, unknown>;
    for (const key of ['output', 'response', 'text', 'content', 'message'] as const) {
      const extracted = extractTextFromJsonPayload(typedPayload[key]);
      if (typeof extracted === 'string' && extracted.trim()) return extracted;
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
    if (typeof extracted === 'string') return extracted;
  } catch {
    return content;
  }
  return content;
};

const cleanExtractedUrl = (url: string): string => url.replace(/[),.;!?]+$/g, '');

const extractAllUrls = (content: string): string[] => {
  const normalized = normalizePotentialJsonMessage(content);
  const urls: string[] = [];
  const urlRegex = /(https?:\/\/[^\s<>"'`)\]}]+)/gi;
  const markdownRegex = /\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(normalized)) !== null) urls.push(cleanExtractedUrl(match[1]));
  while ((match = markdownRegex.exec(normalized)) !== null) urls.push(cleanExtractedUrl(match[1]));
  extractLinkUrls(content).forEach((url) => urls.push(cleanExtractedUrl(url)));
  return Array.from(new Set(urls));
};

const resolveGeneratedFileType = (url: string): GeneratedFileType | null => {
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  if (path.endsWith('.xlsx') || path.endsWith('.xls')) return 'xlsx';
  if (path.endsWith('.docx') || path.endsWith('.doc')) return 'docx';
  return null;
};

const getFileNameFromUrl = (url: string): string => {
  const withoutQuery = url.split('?')[0];
  const rawName = withoutQuery.split('/').pop() || '';
  try { return decodeURIComponent(rawName) || 'generated-file'; } catch { return rawName || 'generated-file'; }
};

const extractGeneratedFileAttachments = (content: string): GeneratedFileAttachment[] => {
  return extractAllUrls(content)
    .map((url) => {
      const fileType = resolveGeneratedFileType(url);
      if (!fileType) return null;
      return { url, fileType, fileName: getFileNameFromUrl(url) };
    })
    .filter((item): item is GeneratedFileAttachment => item !== null);
};

const removeGeneratedFileUrlsFromText = (content: string): string => {
  return content
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s<>"'`]+?\.(?:xlsx|xls|docx|doc)(?:\?[^\s<>"'`]*)?(?:#[^\s<>"'`]*)?)\)/gi, '$1')
    .replace(/`?(https?:\/\/[^\s<>"'`]+?\.(?:xlsx|xls|docx|doc)(?:\?[^\s<>"'`]*)?(?:#[^\s<>"'`]*)?)`?/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// --- Markdown sub-components ---

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
    <div className="my-3">
      <div className="mb-1.5 flex items-center justify-end gap-1.5">
        <button onClick={onDownload} className="text-[10px] px-1.5 py-0.5 rounded border border-white/15 text-gray-300 hover:bg-white/10 inline-flex items-center gap-1">
          <RiDownload2Line className="text-[10px]" /> Download
        </button>
        <button onClick={onShare} className="text-[10px] px-1.5 py-0.5 rounded border border-white/15 text-gray-300 hover:bg-white/10 inline-flex items-center gap-1">
          <RiShareLine className="text-[10px]" /> Share
        </button>
      </div>
      <div ref={tableRef}>{children}</div>
    </div>
  );
};

const MemoChartMarkdownBlock = React.memo(({ content }: { content: string }) => {
  const parsedConfig = useMemo(() => { try { return JSON.parse(content); } catch { return null; } }, [content]);
  if (!parsedConfig) return <code className="bg-white/10 rounded px-1 py-0.5 text-[10px] font-mono text-portfolio-orange">{content}</code>;
  return <ChartBlock config={parsedConfig} />;
});

const MemoFormsMarkdownBlock = React.memo(({ content }: { content: string }) => {
  const parsedData = useMemo(() => { try { return JSON.parse(content); } catch { return null; } }, [content]);
  if (!parsedData || !parsedData.forms || !Array.isArray(parsedData.forms)) return null;
  return <AIFormLink forms={parsedData.forms} />;
});

const markdownComponents: any = {
  h1: (props: any) => <h1 className="text-base font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10" {...props} />,
  h2: (props: any) => <h2 className="text-sm font-bold text-white mt-3 mb-2" {...props} />,
  h3: (props: any) => <h3 className="text-sm font-semibold text-portfolio-orange mt-3 mb-1.5" {...props} />,
  h4: (props: any) => <h4 className="text-xs font-semibold text-white mt-2 mb-1" {...props} />,
  p: (props: any) => <p className="mb-2 leading-relaxed text-gray-300 last:mb-0 whitespace-pre-wrap text-xs" {...props} />,
  a: (props: any) => <a className="text-portfolio-orange hover:text-white underline transition-colors text-xs" target="_blank" rel="noopener noreferrer" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-4 mb-3 space-y-0.5 text-gray-300 text-xs" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-4 mb-3 space-y-0.5 text-gray-300 text-xs" {...props} />,
  li: (props: any) => <li className="pl-0.5 text-xs" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-2 border-portfolio-orange/50 pl-3 py-0.5 my-2 bg-white/5 rounded-r italic text-gray-400 text-xs" {...props} />,
  hr: (props: any) => <hr className="border-white/10 my-4" {...props} />,
  table: (props: any) => (
    <TableWithActions>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-[10px]" {...props} />
      </div>
    </TableWithActions>
  ),
  thead: (props: any) => <thead className="bg-white/5" {...props} />,
  th: (props: any) => <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-white/5 bg-transparent" {...props} />,
  tr: (props: any) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
  td: (props: any) => <td className="px-2 py-1 whitespace-nowrap text-[10px] text-gray-300" {...props} />,
  code: ({ className, children, ...props }: any) => {
    const match = /language-([\w-]+)/.exec(className || '');
    const language = match ? match[1] : '';
    const contentStr = String(children).replace(/\n$/, '');
    if (language === 'chartjs') return <MemoChartMarkdownBlock content={contentStr} />;
    if (language === 'forms-json') return <MemoFormsMarkdownBlock content={contentStr} />;
    return match ? (
      <div className="rounded-lg bg-[#1e1e1e] my-2 overflow-hidden border border-white/10 shadow-lg">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
          <span className="text-[10px] text-gray-400 font-mono">{match[1]}</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500/20" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
            <div className="w-2 h-2 rounded-full bg-green-500/20" />
          </div>
        </div>
        <div className="p-3 overflow-x-auto">
          <code className={`${className} font-mono text-[11px]`} {...props}>{children}</code>
        </div>
      </div>
    ) : (
      <code className="bg-white/10 rounded px-1 py-0.5 text-[10px] font-mono text-portfolio-orange" {...props}>{children}</code>
    );
  },
  pre: (props: any) => <pre className="bg-transparent p-0 m-0" {...props} />,
  img: (props: any) => <img className="rounded-lg max-w-full h-auto my-2 border border-white/10" {...props} alt={props.alt || 'AI generated image'} />,
};

// --- Message content renderer ---

const MessageContentRenderer: React.FC<{ message: ChatMessage }> = React.memo(({ message }) => {
  const isUser = message.sender === 'user';
  const content = useMemo(() => {
    if (isUser) return message.content;
    let c = normalizePotentialJsonMessage(stripLinkUrlBlocks(message.content))
      .replace(/`(https?:\/\/[^`\s]+)`/gi, '[$1]($1)')
      .replace(/<!--FORMS_JSON_START-->([\s\S]*?)<!--FORMS_JSON_END-->/g, '\n```forms-json\n$1\n```\n')
      .replace(/```\s*chartjs/gi, '\n```chartjs')
      .replace(/([^\n])```/g, '$1\n```');
    c = removeGeneratedFileUrlsFromText(c);
    if (message.isStreaming) c += ' ▍';
    return c;
  }, [isUser, message.content, message.isStreaming]);

  if (isUser) return <>{message.content}</>;
  return (
    <div className="markdown-container w-full max-w-full min-w-0 break-words overflow-x-hidden">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}, (prev, next) =>
  prev.message === next.message ||
  (prev.message.id === next.message.id && prev.message.content === next.message.content && prev.message.isStreaming === next.message.isStreaming && prev.message.sender === next.message.sender)
);

// --- Main Component ---

interface AIChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPopup: React.FC<AIChatPopupProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentChat, sendMessage, startNewChat, getProjectChats, switchToChat, isLoading } = useAIChat();
  const { selectedProject } = useProjects();
  const [input, setInput] = useState('');
  const [activeLinksMessageId, setActiveLinksMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Switch to project-specific chat
  useEffect(() => {
    if (isLoading || !isOpen) return;
    if (selectedProject?.id) {
      if (currentChat.projectId !== String(selectedProject.id)) {
        const projectChats = getProjectChats(String(selectedProject.id));
        if (projectChats.length > 0) {
          const latestChat = [...projectChats].sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())[0];
          switchToChat(latestChat.id);
        } else {
          startNewChat(String(selectedProject.id));
        }
      }
    }
  }, [selectedProject?.id, currentChat.projectId, isOpen, isLoading]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat.messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    try {
      await sendMessage(text, selectedProject?.id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [input, sendMessage, selectedProject?.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewChat = () => {
    startNewChat(selectedProject?.id ? String(selectedProject.id) : undefined);
    setInput('');
  };

  const copyMessage = async (content: string) => {
    const clean = normalizePotentialJsonMessage(stripLinkUrlBlocks(content));
    await navigator.clipboard.writeText(clean);
  };

  const shareMessage = async (content: string) => {
    const clean = normalizePotentialJsonMessage(stripLinkUrlBlocks(content));
    if (navigator.share) {
      try { await navigator.share({ text: clean, title: 'MatrixTwin AI' }); return; } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(clean);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-28 right-6 z-50 flex flex-col w-[380px] h-[560px] rounded-2xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(10, 10, 14, 0.92)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/30 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-portfolio-orange/10 flex items-center justify-center border border-portfolio-orange/20">
                <IconContext.Provider value={{ className: 'text-portfolio-orange text-sm' }}>
                  <RiBrainLine />
                </IconContext.Provider>
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-white leading-none">MatrixTwin AI</h3>
                <span className="text-[10px] text-gray-500">Ask anything about your projects</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleNewChat} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="New Chat">
                <RiAddLine className="text-sm" />
              </button>
              <button onClick={() => { onClose(); navigate('/ask-ai'); }} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Open Full Page">
                <RiFullscreenLine className="text-sm" />
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Close">
                <RiCloseLine className="text-sm" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 ai-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-portfolio-orange" />
              </div>
            ) : (
              <>
                {currentChat.messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 mt-6">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                      <RiBrainLine className="text-xl text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-300">How can I help you today?</h3>
                    <p className="text-[10px] max-w-[240px] mt-1.5">Ask me about your project status, tasks, safety reports, or any construction details.</p>
                  </div>
                )}

                {currentChat.messages.map((message) => {
                  const links = message.sender === 'ai' ? extractLinkUrls(message.content) : [];
                  const generatedFiles = message.sender === 'ai' ? extractGeneratedFileAttachments(message.content) : [];
                  const isLinksPanelOpen = activeLinksMessageId === message.id;

                  return (
                    <div key={message.id} className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex ${message.sender === 'user' ? 'items-end max-w-[85%] flex-col' : 'w-full min-w-0 flex-col'}`}>
                        {/* AI avatar + name */}
                        {message.sender !== 'user' && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center ${message.isStreaming ? 'bg-portfolio-orange text-white animate-pulse' : 'bg-transparent text-portfolio-orange border border-white/10'}`}>
                              <IconContext.Provider value={{ className: 'text-[10px]' }}>
                                <RiBrainLine />
                              </IconContext.Provider>
                            </div>
                            <span className="text-xs font-bold text-white leading-none">MatrixTwin AI</span>
                          </div>
                        )}

                        <div className={`rounded-2xl px-3 py-2 text-xs ${message.sender === 'user' ? 'bg-portfolio-orange text-white shadow-md rounded-tr-none' : 'bg-transparent text-gray-200 pl-0 pt-0 border-none shadow-none w-full'}`}>
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-2 space-y-1.5">
                              {message.attachments.map((att, i) => (
                                <div key={`${att.url}-${i}`} className="rounded-lg overflow-hidden border border-white/15 bg-black/30">
                                  {att.fileType === 'image' ? (
                                    <img src={att.url} alt={att.originalName} className="max-w-full h-auto max-h-40 object-contain bg-black/50" />
                                  ) : (
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="block px-2 py-1.5 text-[10px] text-white/90 hover:text-white hover:bg-white/5 transition-colors break-all">
                                      {att.originalName}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {(!message.attachments || message.attachments.length === 0) && message.imageUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden">
                              <img src={message.imageUrl} alt="Uploaded" className="max-w-full h-auto max-h-40 object-contain bg-black/50" />
                            </div>
                          )}

                          {/* Message content */}
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

                          {/* Generated file attachments */}
                          {message.sender === 'ai' && generatedFiles.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {generatedFiles.map((file, fi) => (
                                <a key={`${message.id}-gf-${fi}`} href={file.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 hover:bg-white/5 transition-colors">
                                  <span className="flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1.5 min-w-0">
                                      {file.fileType === 'xlsx' ? <RiFileExcel2Line className="text-portfolio-orange text-sm flex-shrink-0" /> : file.fileType === 'docx' ? <RiFileWord2Line className="text-portfolio-orange text-sm flex-shrink-0" /> : <RiFileLine className="text-portfolio-orange text-sm flex-shrink-0" />}
                                      <span className="text-[10px] text-white truncate">{file.fileType === 'xlsx' ? 'Excel' : 'Word'} · {file.fileName}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-portfolio-orange flex-shrink-0">
                                      Open <RiExternalLinkLine className="text-[10px]" />
                                    </span>
                                  </span>
                                </a>
                              ))}
                            </div>
                          )}

                          {/* AI action buttons */}
                          {message.sender === 'ai' && !message.isStreaming && message.content && (
                            <div className="mt-2 flex items-center justify-start gap-1.5 border-t border-white/10 pt-1.5">
                              <div className="flex items-center gap-1">
                                {links.length > 0 && (
                                  <button onClick={() => setActiveLinksMessageId(isLinksPanelOpen ? null : message.id)} className={`w-5 h-5 rounded-full border text-[9px] inline-flex items-center justify-center ${isLinksPanelOpen ? 'border-portfolio-orange text-portfolio-orange bg-portfolio-orange/10' : 'border-white/20 text-gray-300 hover:bg-white/10'}`} title="Sources">
                                    <RiLinksLine className="text-[10px]" />
                                  </button>
                                )}
                                <button onClick={() => copyMessage(message.content)} className="w-5 h-5 rounded-full border border-white/20 text-gray-300 hover:bg-white/10 inline-flex items-center justify-center" title="Copy">
                                  <RiFileCopyLine className="text-[10px]" />
                                </button>
                                <button onClick={() => shareMessage(message.content)} className="w-5 h-5 rounded-full border border-white/20 text-gray-300 hover:bg-white/10 inline-flex items-center justify-center" title="Share">
                                  <RiShareLine className="text-[10px]" />
                                </button>
                              </div>
                              <span className="text-[9px] text-gray-500">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}

                          {/* Links panel */}
                          {message.sender === 'ai' && links.length > 0 && isLinksPanelOpen && (
                            <div className="mt-1.5 rounded-lg border border-white/10 bg-black/40 p-1.5 space-y-0.5">
                              {links.map((url, li) => (
                                <a key={`${message.id}-link-${li}`} href={url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-portfolio-orange hover:text-white break-all">
                                  {url}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* User message actions */}
                        {message.sender === 'user' && (
                          <div className="mt-0.5 flex items-center justify-end gap-1">
                            <span className="text-[9px] text-white/70">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button onClick={() => copyMessage(message.content)} className="w-5 h-5 rounded-full border border-white/25 text-white/80 hover:bg-white/10 hover:text-white inline-flex items-center justify-center" title="Copy">
                              <RiFileCopyLine className="text-[10px]" />
                            </button>
                            <button onClick={() => shareMessage(message.content)} className="w-5 h-5 rounded-full border border-white/25 text-white/80 hover:bg-white/10 hover:text-white inline-flex items-center justify-center" title="Share">
                              <RiShareLine className="text-[10px]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3 bg-black/30 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1.5 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your project..."
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none resize-none text-xs text-white placeholder-gray-500 min-h-[36px] max-h-[80px] py-2 px-2 scrollbar-hide"
                rows={1}
                style={{ height: 'auto', minHeight: '36px' }}
              />
              <Button
                onClick={handleSend}
                className="rounded-lg w-8 h-8 p-0 flex items-center justify-center bg-portfolio-orange hover:bg-portfolio-orange/80 transition-all shadow-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!input.trim()}
              >
                <RiSendPlaneFill className="text-sm" />
              </Button>
            </div>
            <div className="text-center mt-1.5">
              <span className="text-[9px] text-gray-600">AI can make mistakes. Please verify important information.</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

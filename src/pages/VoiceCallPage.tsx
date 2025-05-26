import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiPhoneLine, 
  RiCloseLine,
  RiMicLine, 
  RiMicOffFill,
  RiVolumeUpLine,
  RiVolumeMuteFill,
  RiArrowLeftLine,
  RiWechatLine,
  RiLoaderLine,
  RiErrorWarningLine,
  RiPlayCircleFill,
  RiPauseCircleFill
} from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAIChat } from '../contexts/AIChatContext';
import { Button } from '../components/ui/Button';

// Define API URL - adjust the port depending on your actual server setup
const API_URL = 'https://matrixbim-server.onrender.com/api/dashscope';

// Define speech recognition interface for TypeScript
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;

const VoiceCallPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [hasApiError, setHasApiError] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [listening, setListening] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useAIChat();

  // Voice call is active by default
  const [isCallActive, setIsCallActive] = useState(true);

  // Initialize Speech Recognition
  useEffect(() => {
    // Create speech recognition object
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      // Set up event handlers
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        // Restart listening if call is active and not muted
        if (isCallActive && !isMuted && callStatus === 'connected') {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error restarting speech recognition:', error);
          }
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('Speech recognized:', transcript);
        if (transcript && !isProcessingVoice) {
          sendVoiceMessage(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    } else {
      console.error('Speech Recognition API not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Start listening automatically when connected
  useEffect(() => {
    if (callStatus === 'connected' && isCallActive && !isMuted && !isListening && !isProcessingVoice) {
      startListening();
    }
  }, [callStatus, isCallActive, isMuted, isListening, isProcessingVoice]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [responses]);

  // Initialize memory ID on component mount
  useEffect(() => {
    const createMemory = async () => {
      try {
        console.log('Attempting to create memory session...');
        const response = await axios.post(`${API_URL}/create-memory`, {}, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Create memory response:', response.data);
        if (response.data && response.data.output && response.data.output.memory_id) {
          setMemoryId(response.data.output.memory_id);
          setHasApiError(false);
        }
      } catch (error) {
        console.error('Error creating memory:', error);
        setHasApiError(true);
      }
    };

    createMemory();
  }, []);

  // Set up call timer
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Initial greeting
      const sendInitialGreeting = async () => {
        try {
          console.log('Sending initial voice call...');
          const response = await axios.post(`${API_URL}/voice-call`, {
            prompt: 'Introduce yourself briefly as Matrix AI. Speak in English.',
            stream: false
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('Voice call response:', response.data);
          // Extract text from the new response format
          let aiResponse = '';
          if (response.data && response.data.output && response.data.output.text) {
            aiResponse = response.data.output.text;
          }
          
          if (aiResponse) {
            setResponses(prev => [...prev, aiResponse]);
            speakText(aiResponse);
            setHasApiError(false);
          }
        } catch (error) {
          console.error('Error getting AI response:', error);
          setHasApiError(true);
          
          // Add a default greeting anyway
          const defaultGreeting = "Hello! I'm Matrix AI, your construction assistant. How can I help you today?";
          setResponses(prev => [...prev, defaultGreeting]);
          speakText(defaultGreeting);
        }
      };

      sendInitialGreeting();
      
      // Start listening after greeting
      setTimeout(() => {
        if (!isMuted) {
          startListening();
        }
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  // Set call to connected after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Effect to handle muting
  useEffect(() => {
    if (isMuted && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (!isMuted && callStatus === 'connected' && !isListening && !isProcessingVoice) {
      startListening();
    }
  }, [isMuted]);

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!isSpeakerOn) return;
    
    // Use browser's speech synthesis
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    speech.lang = 'en-US';
    
    // Pause recognition while speaking to avoid feedback
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    speech.onend = () => {
      // Resume listening after speaking if call is active and not muted
      if (isCallActive && !isMuted && callStatus === 'connected') {
        startListening();
      }
    };
    
    window.speechSynthesis.speak(speech);
  };

  // Format call duration
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle hanging up
  const handleHangUp = () => {
    // Stop speech synthesis
    window.speechSynthesis.cancel();
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setCallStatus('disconnected');
    setTimeout(() => {
      navigate('/ask-ai');
    }, 1000);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    
    // If turning off, stop any ongoing speech
    if (isSpeakerOn) {
      window.speechSynthesis.cancel();
    }
  };

  // Toggle call active/pause
  const toggleCallActive = () => {
    setIsCallActive(!isCallActive);
    
    if (isCallActive) {
      // Pause call
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    } else {
      // Resume call
      if (!isMuted && callStatus === 'connected') {
        startListening();
      }
    }
  };

  // Start voice recognition
  const startListening = () => {
    if (isMuted || !recognitionRef.current || isProcessingVoice || isListening) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };

  // Send recognized voice message to API
  const sendVoiceMessage = async (transcript: string) => {
    if (!transcript.trim()) {
      return;
    }
    
    setIsProcessingVoice(true);
    
    // Add user message to chat
    setResponses(prev => [...prev, `You: ${transcript}`]);
    
    try {
      console.log('Sending voice message:', transcript);
      // Send to voice API
      const response = await axios.post(`${API_URL}/voice-call`, {
        prompt: `${transcript} (Please respond in English)`,
        stream: false,
        memory_id: memoryId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Voice message response:', response.data);
      // Extract text from the new response format
      let aiResponse = '';
      if (response.data && response.data.output && response.data.output.text) {
        aiResponse = response.data.output.text;
      }
      
      if (aiResponse) {
        // Add AI response
        setResponses(prev => [...prev, aiResponse]);
        speakText(aiResponse);
        setHasApiError(false);
        
        // Also send to chat context for history
        await sendMessage(transcript);
      }
    } catch (error) {
      console.error('Error processing voice message:', error);
      setHasApiError(true);
      
      // Add a fallback response
      const fallbackResponse = "I'm sorry, I wasn't able to process that request. Could you please try again?";
      setResponses(prev => [...prev, fallbackResponse]);
      speakText(fallbackResponse);
    } finally {
      setIsProcessingVoice(false);
    }
  };
  
  const switchToChat = () => {
    // Cancel any ongoing speech or recognition
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    navigate('/ask-ai');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-dark-950 to-dark-900 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 bg-ai-dots opacity-20 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-gradient-radial from-ai-blue/10 to-transparent pointer-events-none z-0"></div>
      
      {/* Voice wave animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <AnimatePresence>
          {callStatus === 'connected' && !isMuted && isListening && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-ai-blue/30"
                  initial={{ width: 100, height: 100, opacity: 0.7 }}
                  animate={{ 
                    width: [100, 300 + i * 50], 
                    height: [100, 300 + i * 50], 
                    opacity: [0.7, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3, 
                    delay: i * 0.5,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
      
      {/* Header */}
      <div className="bg-dark-900 shadow-lg z-10 px-4 py-3 flex items-center">
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          className="mr-2 text-gray-300 hover:text-white p-2"
        >
          <RiArrowLeftLine className="text-2xl" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-ai-blue via-ai-purple to-ai-teal">
            Matrix AI Assistant
          </h1>
          <div className="flex items-center">
            <p className="text-sm text-gray-400 mr-2">
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'connected' && `Voice call · ${formatTime(callDuration)}`}
              {callStatus === 'disconnected' && 'Call ended'}
            </p>
            {callStatus === 'connected' && (
              <div className={`h-2 w-2 rounded-full ${
                isListening ? 'bg-green-500 animate-pulse' : isProcessingVoice ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            )}
          </div>
        </div>
        <Button
          onClick={switchToChat}
          variant="ghost"
          className="ml-2 text-gray-300 hover:text-ai-blue p-2"
        >
          <RiWechatLine className="text-2xl" />
        </Button>
      </div>
      
      {/* API error indicator */}
      {hasApiError && (
        <div className="bg-amber-500/20 border-l-4 border-amber-500 p-3 text-amber-200 text-sm flex items-center">
          <RiErrorWarningLine className="text-amber-400 mr-2 flex-shrink-0" />
          <span>Experiencing connection issues with the AI service. Some features may be limited.</span>
        </div>
      )}
      
      {/* Call status banner */}
      <div className={`py-2 px-4 text-center text-sm ${
        isListening ? 'bg-green-500/20 text-green-200' : 
        isProcessingVoice ? 'bg-yellow-500/20 text-yellow-200' : 
        isMuted ? 'bg-red-500/20 text-red-200' :
        'bg-gray-500/20 text-gray-200'
      }`}>
        {isListening && 'Listening...'}
        {isProcessingVoice && 'Processing your request...'}
        {isMuted && 'Microphone is muted. Unmute to speak.'}
        {!isListening && !isProcessingVoice && !isMuted && 'Voice call is active. Speak to interact with Matrix AI.'}
      </div>
      
      {/* Main call area */}
      <div className="flex-1 flex flex-col items-center justify-start relative overflow-hidden p-4 z-10">
        {/* Profile avatar */}
        <div className="mb-6 relative">
          <div className={`h-24 w-24 rounded-full bg-gradient-to-r from-ai-blue to-ai-purple flex items-center justify-center shadow-ai-glow ${
            isListening ? 'animate-pulse' : ''
          }`}>
            <IconContext.Provider value={{ className: "text-white text-5xl" }}>
              <RiVolumeUpLine />
            </IconContext.Provider>
          </div>
          
          {/* Status indicator */}
          <div className={`absolute bottom-1 right-1 h-6 w-6 rounded-full border-2 border-dark-900 ${
            callStatus === 'connected' ? hasApiError ? 'bg-amber-500' : 'bg-green-500' : 
            callStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
        
        {/* Conversation transcript (WhatsApp style bubbles) */}
        <div className="w-full max-w-md h-[50vh] overflow-y-auto mb-4 bg-dark-800/50 backdrop-blur-md rounded-xl p-4 border border-dark-700/50">
          <AnimatePresence>
            {responses.map((response, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-3 max-w-[85%] ${
                  response.startsWith('You:') ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className={`rounded-xl px-4 py-3 ${
                  response.startsWith('You:') 
                    ? 'bg-primary-500 text-white rounded-tr-none' 
                    : 'bg-dark-700 text-white rounded-tl-none'
                }`}>
                  {response.startsWith('You:') ? response : response}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {responses.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              Voice call is active. Just speak naturally to interact with the AI.
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Call controls */}
      <div className="bg-dark-900/80 backdrop-blur-md border-t border-dark-800 p-6 z-10">
        <div className="flex justify-around max-w-md mx-auto">
          {/* Mute button */}
          <Button
            onClick={toggleMute}
            variant="ghost"
            className={`p-5 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-dark-800 text-gray-300'}`}
          >
            <IconContext.Provider value={{ className: "text-2xl" }}>
              {isMuted ? <RiMicOffFill /> : <RiMicLine />}
            </IconContext.Provider>
          </Button>
          
          {/* Pause/Resume call button */}
          <Button
            onClick={toggleCallActive}
            variant="ghost"
            className={`p-5 rounded-full ${!isCallActive ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-800 text-gray-300'}`}
          >
            <IconContext.Provider value={{ className: "text-2xl" }}>
              {isCallActive ? <RiPauseCircleFill /> : <RiPlayCircleFill />}
            </IconContext.Provider>
          </Button>
          
          {/* Hang up button */}
          <Button
            onClick={handleHangUp}
            variant="ai"
            className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white"
          >
            <IconContext.Provider value={{ className: "text-2xl" }}>
              <RiCloseLine />
            </IconContext.Provider>
          </Button>
          
          {/* Speaker button */}
          <Button
            onClick={toggleSpeaker}
            variant="ghost"
            className={`p-5 rounded-full ${!isSpeakerOn ? 'bg-red-500/20 text-red-400' : 'bg-dark-800 text-gray-300'}`}
          >
            <IconContext.Provider value={{ className: "text-2xl" }}>
              {isSpeakerOn ? <RiVolumeUpLine /> : <RiVolumeMuteFill />}
            </IconContext.Provider>
          </Button>
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 text-center">
        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full ${
          isListening ? 'bg-green-800/40 text-green-300' : 
          isProcessingVoice ? 'bg-yellow-800/40 text-yellow-300' : 
          'bg-dark-800/40 text-gray-300'
        }`}>
          <span className="text-sm font-medium">{
            isListening ? 'Listening...' : 
            isProcessingVoice ? 'Processing...' : 
            'Ready'
          }</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallPage; 
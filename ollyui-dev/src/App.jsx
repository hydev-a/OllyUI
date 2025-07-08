import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, MessageSquare, Plus, ChevronLeft, ChevronRight, Trash2, Edit2, Check, X, StopCircle, User, Bot, Paperclip, Download, RotateCcw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import MarkdownRenderer from './components/MarkdownRenderer';
import CopyButton from './components/CopyButton';
import SettingsPopup from './components/SettingsPopup';
import isRtl from './utils/isRtl';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

const OllamaChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [abortController, setAbortController] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [availableModels, setAvailableModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const [settings, setSettings] = useState({
    model: 'llama2',
    temperature: 1.0,
    maxTokens: 2048,
    systemPrompt: 'You are a helpful AI assistant. Be concise and accurate in your responses.',
    historyLength: 20
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    const initializeState = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) throw new Error('Ollama server not responding');
        const data = await response.json();
        const available = data.models || [];
        setAvailableModels(available);

        const savedSettings = JSON.parse(localStorage.getItem('ollama-settings') || '{}');
        const savedConversations = JSON.parse(localStorage.getItem('ollama-conversations') || '[]');

        if (savedConversations.length > 0) {
          setConversations(savedConversations);
          setCurrentConversationId(savedConversations[0].id);
          setMessages(savedConversations[0].messages);
        }

        if (available.length > 0) {
          const savedModelExists = available.some(m => m.name === savedSettings.model);
          if (savedModelExists) {
            setSettings(prev => ({ ...prev, ...savedSettings }));
          } else {
            setSettings(prev => ({ ...prev, ...savedSettings, model: available[0].name }));
          }
        } else {
          setSettings(prev => ({ ...prev, ...savedSettings }));
        }
      } catch (e) {
        console.error("Failed to initialize app state:", e);
        const savedSettings = JSON.parse(localStorage.getItem('ollama-settings') || '{}');
        setSettings(prev => ({ ...prev, ...savedSettings }));
        const savedConversations = JSON.parse(localStorage.getItem('ollama-conversations') || '[]');
        setConversations(savedConversations);
      }
    };

    initializeState();
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('ollama-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('ollama-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('ollama-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme ? savedTheme === 'dark' : prefersDark;

    setIsDarkMode(initialTheme);

    if (initialTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    localStorage.setItem('ollama-theme', newIsDarkMode ? 'dark' : 'light');
    if (newIsDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleVoiceInput = () => {
    if (isListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support voice recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInputValue(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const exportConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    let markdownContent = `# ${conversation.name}\n\n`;
    conversation.messages.forEach(msg => {
      const author = msg.role === 'user' ? 'User' : 'Assistant';
      markdownContent += `**${author}:**\n${msg.content}\n\n---\n\n`;
    });
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.name.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    if (messages.length < 1) return;
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex !== -1) {
      const lastUserMessage = messages[lastUserMessageIndex];
      sendMessage(lastUserMessage.content, lastUserMessageIndex);
    }
  };

  const handleExamplePrompt = (prompt) => {
    setInputValue(prompt);
    setTimeout(() => sendMessage(prompt), 0);
  };

  const handleFileAttachment = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsLoading(true);
    let extractedText = `\n\n--- Start of attached document: ${file.name} ---\n\n`;
    try {
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const pdfData = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            extractedText += textContent.items.map(item => item.str).join(' ');
            extractedText += '\n';
          }
          extractedText += `\n--- End of attached document: ${file.name} ---\n\n`;
          setInputValue(prev => prev + extractedText);
          setIsLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          extractedText += e.target.result;
          extractedText += `\n--- End of attached document: ${file.name} ---\n\n`;
          setInputValue(prev => prev + extractedText);
          setIsLoading(false);
        };
        reader.readAsText(file);
      } else {
        alert("Unsupported file type. Please select a .txt or .pdf file.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("There was an error reading the file.");
      setIsLoading(false);
    }
    event.target.value = null;
  };

  const createNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation = {
      id: newId,
      name: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([]);
  };

  const selectConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
    }
  };

  const updateConversationName = (conversationId, newName) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, name: newName }
          : conv
      )
    );
  };

  const deleteConversation = (conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      const remaining = conversations.filter(c => c.id !== conversationId);
      if (remaining.length > 0) {
        setCurrentConversationId(remaining[0].id);
        setMessages(remaining[0].messages);
      } else {
        setCurrentConversationId(null);
        setMessages([]);
      }
    }
  };

  const updateCurrentConversation = (newMessages) => {
    if (!currentConversationId) return;
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, messages: newMessages }
          : conv
      )
    );
  };

  const generateConversationName = (firstMessage) => {
    const words = firstMessage.split(' ').slice(0, 4);
    return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '');
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const sendMessage = async (messageContent = null, editIndex = null) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;
    let newMessages;
    if (editIndex !== null) {
      newMessages = messages.slice(0, editIndex);
      newMessages.push({ role: 'user', content });
    } else {
      const userMessage = { role: 'user', content };
      newMessages = [...messages, userMessage];
    }
    if (!currentConversationId) {
      const newId = Date.now().toString();
      const conversationName = generateConversationName(content);
      const newConversation = {
        id: newId,
        name: conversationName,
        messages: newMessages,
        createdAt: new Date().toISOString()
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newId);
    }
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    setStreamingMessage('');
    setEditingMessageIndex(null);
    setEditingMessageContent('');
    const controller = new AbortController();
    setAbortController(controller);
    const systemPrompt = { role: 'system', content: settings.systemPrompt };
    const trimmedHistory = newMessages.length > settings.historyLength
      ? newMessages.slice(-settings.historyLength)
      : newMessages;
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.model,
          messages: [systemPrompt, ...trimmedHistory].map(msg => ({
            ...msg,
            content: String(msg.content || '')
          })),
          stream: true,
          options: {
            temperature: settings.temperature,
            num_predict: settings.maxTokens
          }
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message && data.message.content) {
              streamedContent += data.message.content;
              setStreamingMessage(streamedContent);
            }
          } catch (e) {}
        }
      }
      const assistantMessage = { role: 'assistant', content: streamedContent };
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      setStreamingMessage('');
      updateCurrentConversation(finalMessages);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error sending message:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure Ollama is running and try again.'
        };
        const finalMessages = [...newMessages, errorMessage];
        setMessages(finalMessages);
        setStreamingMessage('');
        updateCurrentConversation(finalMessages);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const startEditingMessage = (index, content) => {
    setEditingMessageIndex(index);
    setEditingMessageContent(content);
  };

  const saveMessageEdit = () => {
    if (editingMessageContent.trim()) {
      sendMessage(editingMessageContent.trim(), editingMessageIndex);
    }
  };

  const cancelMessageEdit = () => {
    setEditingMessageIndex(null);
    setEditingMessageContent('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveMessageEdit();
    }
  };

  const startEditing = (conversation) => {
    setEditingConversationId(conversation.id);
    setEditingName(conversation.name);
  };

  const saveEdit = () => {
    if (editingName.trim()) {
      updateConversationName(editingConversationId, editingName.trim());
    }
    setEditingConversationId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingConversationId(null);
    setEditingName('');
  };

  const clearAllChats = () => {
    if (window.confirm('Are you sure you want to clear all conversations?')) {
      setConversations([]);
      setMessages([]);
      setCurrentConversationId(null);
      localStorage.removeItem('ollama-conversations');
    }
  };

  const examplePrompts = [
    "Explain quantum computing in simple terms",
    "What are the top 3 tourist attractions in Croatia?",
    "Write a short story in the style of Edgar Allan Poe",
    "Generate a Python script to organize files by extension"
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className={`bg-slate-800/60 backdrop-blur-sm border-r border-slate-700/50 transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-80'} overflow-hidden`}>
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-800 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            <span className="font-medium">New Chat</span>
          </button>
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Conversations</h3>
            {conversations.length > 0 && (
              <button
                onClick={clearAllChats}
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
                title="Clear all chats"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-700/50 dark:bg-slate-700/50 border border-slate-600/50 dark:border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
            {conversations
              .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${currentConversationId === conversation.id
                    ? 'bg-slate-700 border border-slate-600/50'
                    : 'hover:bg-slate-700/40'
                    }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <MessageSquare size={16} className="flex-shrink-0 text-slate-400" />
                  {editingConversationId === conversation.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-slate-700 text-white px-2 py-1 text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                      />
                      <button onClick={saveEdit} className="text-green-400 hover:text-green-300 p-1">
                        <Check size={14} />
                      </button>
                      <button onClick={cancelEdit} className="text-red-400 hover:text-red-300 p-1">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm truncate text-slate-200">{conversation.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportConversation(conversation.id); }}
                          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                          title="Export conversation"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(conversation);
                          }}
                          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700/50"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <h1 className="text-xl font-semibold text-slate-200">
              OllyUI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 
            <button
              onClick={toggleTheme}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700/50"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button> 
            */}
            <button
              onClick={() => setShowSettings(true)}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700/50"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-blue-700 dark:bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <p className="text-lg mb-2 text-slate-700 dark:text-slate-300">Welcome to OllyUI</p>
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleExamplePrompt(prompt)}
                    className="text-left p-3 bg-slate-200/50 dark:bg-slate-800/60 rounded-lg border border-slate-300 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-emerald-400" />
                    </div>
                  )}
                  <div className={`group relative max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    {editingMessageIndex === index ? (
                      <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600/50">
                        <textarea
                          value={editingMessageContent}
                          onChange={(e) => setEditingMessageContent(e.target.value)}
                          onKeyPress={handleEditKeyPress}
                          className="w-full bg-slate-800 text-white p-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600"
                          rows="3"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={saveMessageEdit}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Save & Continue
                          </button>
                          <button
                            onClick={cancelMessageEdit}
                            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`relative px-4 py-3 rounded-2xl ${message.role === 'user'
                          ? 'bg-blue-800 text-white shadow-lg'
                          : 'bg-slate-700/60 text-slate-100 border border-slate-600/30'
                          }`} dir={isRtl(String(message.content).trim()) ? 'rtl' : 'ltr'}
                      >
                        {message.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                          <MarkdownRenderer content={String(message.content).trim()} textAlign={isRtl(String(message.content).trim()) ? 'text-right' : 'text-left'} />
                        )}
                        <div className={`absolute -top-2 ${message.role === 'user' ? '-left-2' : '-right-2'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-slate-800 rounded-lg p-1 shadow-lg border border-slate-600/50`}>
                          <div className="relative">
                            <CopyButton content={message.content} />
                          </div>
                          {message.role === 'user' && (
                            <button
                              onClick={() => startEditingMessage(index, message.content)}
                              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-600/30"
                              title="Edit message"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {message.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                            <button
                              onClick={handleRegenerate}
                              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-600/30"
                              title="Regenerate response"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && streamingMessage && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-emerald-400" />
                  </div>
                  <div className="group relative max-w-[80%] bg-slate-700/60 text-slate-100 px-4 py-3 rounded-2xl border border-slate-600/30" dir={isRtl(streamingMessage) ? 'rtl' : 'ltr'}>
                    <MarkdownRenderer content={streamingMessage.trim()} isStreaming={true} textAlign={isRtl(streamingMessage) ? 'text-right' : 'text-left'} />
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 rounded-lg p-1 shadow-lg border border-slate-600/50">
                      <div className="relative">
                        <CopyButton content={streamingMessage} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {isLoading && !streamingMessage && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-emerald-400" />
                  </div>
                  <div className="bg-slate-700/60 text-slate-100 px-4 py-3 rounded-2xl border border-slate-600/30">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-slate-300">Connecting...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message or attach a file..."
                  dir={isRtl(inputValue) ? 'rtl' : 'ltr'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-12 pr-4 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  rows="1"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={20} />
                </button>
                {/* 
                <button
                  onClick={handleVoiceInput}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors ${isListening ? 'text-blue-500 animate-pulse' : ''}`}
                  title="Voice input"
                >
                  <Mic size={20} />
                </button> 
                */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAttachment}
                  className="hidden"
                  accept=".pdf,.txt"
                />
              </div>
              {isLoading ? (
                <button
                  onClick={stopGeneration}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                >
                  <StopCircle size={20} />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim()}
                  className="bg-blue-800 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                >
                  <Send size={20} />
                  <span>Send</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>Shift+Enter for new line</span>
                {conversations.length > 0 && <span>•</span>}
                {conversations.length > 0 && (
                  <span>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>Model: {settings.model}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Popup */}
      <SettingsPopup
        settings={settings}
        setSettings={setSettings}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        availableModels={availableModels}
      />

      {/* Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.8);
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default OllamaChat;
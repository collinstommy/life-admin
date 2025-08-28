import React, { useState } from 'react';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageAvatar } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputSubmit, PromptInputToolbar } from '@/components/ai-elements/prompt-input';
import { useNavigate } from '@tanstack/react-router';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AgentScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you add expenses. Try saying something like "Add 50 euro for groceries" or "Add 200 euro expense for car repair".'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput })
      });

      const responseText = await response.text();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const examplePrompts = [
    'Add 50 euro for groceries',
    'Add 200 euro expense for car repair',
    'Add 25 euro for Netflix subscription'
  ];

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        .glass-card {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
      
      {/* Navigation Header */}
      <div className="glass-card sticky top-0 z-50 border-b border-slate-200/50 rounded-b-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate({ to: '/' })}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors"
            >
              <span className="icon-[mdi--chevron-left] w-5 h-5 mr-2"></span>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl mb-4 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">💰 AI Expense Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add expenses naturally using voice or text. I'll automatically categorize everything for you.
          </p>
        </div>

        {/* Messages Container */}
        <Conversation className="flex-1 mb-4">
          <ConversationContent className="space-y-3">
            {messages.map((message: any) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                </MessageContent>
                <MessageAvatar 
                  src={message.role === 'user' ? '/user-avatar.png' : '/ai-avatar.png'}
                  name={message.role === 'user' ? 'User' : 'AI'}
                />
              </Message>
            ))}
            {isLoading && (
              <Message from="assistant">
                <MessageContent>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                  </div>
                </MessageContent>
                <MessageAvatar 
                  src="/ai-avatar.png"
                  name="AI"
                />
              </Message>
            )}
          </ConversationContent>
        </Conversation>

        {/* Input Form */}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={input}
            onChange={handleInputChange}
            placeholder="Add 50 euro for groceries..."
            disabled={isLoading}
          />
          <PromptInputToolbar>
            <div className="flex-1" />
            <PromptInputSubmit
              disabled={isLoading || !input.trim()}
              status={isLoading ? 'submitted' : undefined}
            />
          </PromptInputToolbar>
        </PromptInput>

        {/* Example Prompts */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">✨ Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example) => (
              <button
                key={example}
                onClick={() => {
                  const event = { target: { value: example } } as React.ChangeEvent<HTMLTextAreaElement>;
                  handleInputChange(event);
                  setTimeout(() => {
                    const form = document.querySelector('form') as HTMLFormElement;
                    if (form) {
                      form.requestSubmit();
                    }
                  }, 0);
                }}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
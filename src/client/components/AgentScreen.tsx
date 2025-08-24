import React, { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AgentScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you add expenses. Try saying something like "Add 50 euro for groceries" or "Add 200 euro expense for car repair".'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl mb-4 border border-base-300">
        <h1 className="text-2xl font-bold text-base-content">💰 AI Expense Assistant</h1>
        <p className="text-base-content/70 mt-2">
          Add expenses naturally using voice or text. I'll automatically categorize everything for you.
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 px-1">
        {messages.map((message: any) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                message.role === 'user'
                  ? 'bg-primary text-primary-content rounded-br-md'
                  : 'bg-base-200 text-base-content rounded-bl-md'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-base-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Add 50 euro for groceries..."
            disabled={isLoading}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            style={{ minHeight: '40px' }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn btn-primary btn-square"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </form>

      {/* Example Prompts */}
      <div className="mt-4 p-4 bg-base-200/50 rounded-xl border border-base-300">
        <p className="text-sm text-base-content/70 mb-3 font-medium">✨ Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((example) => (
            <button
              key={example}
              onClick={() => {
                const event = { target: { value: example } } as React.ChangeEvent<HTMLInputElement>;
                handleInputChange(event);
                handleSubmit(event);
              }}
              disabled={isLoading}
              className="btn btn-sm btn-ghost bg-base-100 hover:bg-primary/10 text-xs"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
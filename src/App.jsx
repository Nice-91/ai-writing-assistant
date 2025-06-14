import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    localforage.getItem('history').then((data) => {
      if (data) setHistory(data);
    });
  }, []);

  useEffect(() => {
    localforage.setItem('history', history);
  }, [history]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'ai-writing-assistant',
        },
        body: JSON.stringify({
          model: 'openrouter/openai/gpt-3.5-turbo',

          messages: [
            { role: 'system', content: 'You are a helpful writing assistant.' },
            { role: 'user', content: input },
          ],
        }),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (!data.choices || !data.choices[0]) {
        throw new Error('No choices returned.');
      }

      const aiMessage = data.choices[0].message.content;

      const newItem = { prompt: input, response: aiMessage };
      setHistory([newItem, ...history]);
      setInput('');
    } catch (err) {
      console.error('Fetch error:', err);
      alert('API Error. Check your key, model, or internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleDelete = (index) => {
    const updated = [...history];
    updated.splice(index, 1);
    setHistory(updated);
  };

  const clearAll = () => {
    setHistory([]);
  };

  const filteredHistory = history.filter((item) =>
    item.prompt.toLowerCase().includes(search.toLowerCase()) ||
    item.response.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h1>🧠 AI Writing Assistant</h1>

      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Type your prompt..."
        />
        <button onClick={handleSubmit}>Generate</button>
        <button className="clear-all" onClick={clearAll}>Clear All</button>
      </div>

      {loading && <p>Generating...</p>}

      <input
        type="text"
        className="search"
        placeholder="Search history..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="history">
        {filteredHistory.map((item, i) => (
          <div key={i} className="history-item">
            <p><strong>You:</strong> {item.prompt}</p>
            <pre><strong>AI:</strong> {item.response}</pre>
            <button className="delete-btn" onClick={() => handleDelete(i)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

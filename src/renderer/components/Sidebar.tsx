import React, { useState } from 'react';
import './Sidebar.css';

export default function Sidebar() {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample notes data for demonstration
  const sampleNotes = [
    {
      id: 1,
      title: 'Welcome to LockrNotes',
      preview: 'This is your first note. Start writing to create new notes...',
      date: '2024-10-08',
      content:
        'Welcome to LockrNotes! This is a secure note-taking application.',
    },
    {
      id: 2,
      title: 'Meeting Notes',
      preview: "Important discussion points from today's meeting...",
      date: '2024-10-07',
      content: 'Meeting notes content here...',
    },
  ];

  const handleNewNote = () => {
    // setNoteTitle('');
    // setNoteContent('');
  };

  const handleNoteClick = (note: any) => {
    // setNoteTitle(note.title);
    // setNoteContent(note.content);
  };

  const handleKeyDown = (event: React.KeyboardEvent, note: any) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleNoteClick(note);
    }
  };

  return (
    <aside>
      {/* Sidebar with notes list */}
      <div className="sidebar">
        <div className="sidebar-header">
          <img
            src="../../assets/logo_a.png"
            alt="LockrNotes"
            className="app-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNewNote}
          >
            <span className="icon">+</span>
            New Note
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search notes..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="notes-list">
          {sampleNotes.map((note, index) => (
            <div
              key={note.id}
              className={`note-item ${index === 0 ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => handleNoteClick(note)}
              onKeyDown={(e) => handleKeyDown(e, note)}
            >
              <div className="note-item-title">{note.title}</div>
              <div className="note-item-preview">{note.preview}</div>
              <div className="note-item-date">{note.date}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

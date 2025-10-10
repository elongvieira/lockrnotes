import React, { useState } from 'react';
import AppBar from '../components/AppBar';

export default function Main() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
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

  const wordCount = noteContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const handleNewNote = () => {
    setNoteTitle('');
    setNoteContent('');
  };

  const handleSave = () => {
    // Save functionality would be implemented here
    // console.log('Saving note:', { title: noteTitle, content: noteContent });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setNoteTitle('');
    setNoteContent('');
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleNoteClick = (note: any) => {
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const handleKeyDown = (event: React.KeyboardEvent, note: any) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleNoteClick(note);
    }
  };

  return (
    <>
      <AppBar />
      <div className="app-container">
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

        {/* Main editing area */}
        <div className="main-content">
          <div className="editor-header">
            <input
              type="text"
              placeholder="Note title..."
              className="note-title-input"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <div className="editor-actions">
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                style={{
                  display: noteTitle || noteContent ? 'inline-flex' : 'none',
                }}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="editor-container">
            <textarea
              placeholder="Start writing your note here..."
              className="note-editor"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
          </div>

          <div className="status-bar">
            <span>Ready</span>
            <span>{wordCount} words</span>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="modal show">
            <div className="modal-content">
              <h3>Confirm Deletion</h3>
              <p>
                Are you sure you want to delete this note? This action cannot be
                undone.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

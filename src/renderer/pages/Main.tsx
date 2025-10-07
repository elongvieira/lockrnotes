import React from 'react';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';

export default function Main() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Editor />
      </main>
    </div>
  );
}

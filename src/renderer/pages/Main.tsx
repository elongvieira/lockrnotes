import AppBar from '../components/AppBar';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import StatusBar from '../components/StatusBar';

export default function Main() {
  return (
    <>
      <AppBar />
      <div className="app-container">
        <Sidebar />
        <Editor />
      </div>
      <StatusBar
        currentFile="teste.txt"
        isEncrypted={false}
        wordCount={42}
        status="Ready"
      />
    </>
  );
}

import AppBar from '../components/AppBar';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';

export default function Main() {
  return (
    <>
      <AppBar />
      <div className="app-container">
        <Sidebar />
        <Editor />
      </div>
    </>
  );
}

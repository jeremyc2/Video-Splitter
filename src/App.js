import React, { useState } from 'react';
import './App.css';
import './loader.css';
import ResultVideo from './ResultVideo';
import UploadForm from './UploadForm';

function App() {
  const [videoData, setVideoData] = useState({ isLoading: false });
  const [progress, setProgress] = useState(0);

  return (
    <div className='App'>
      {videoData.isLoading && <div className='absolute inset-0 bg-black bg-opacity-80'>
        <div className='absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 flex flex-col items-center font-[roboto]'>
          <div className="loader">Load&nbsp;ng</div>
          <div>{progress}%</div>
        </div>
      </div>}
      <div className='watermark'>VS</div>
      <h1 className='mt-10 font-extrabold tracking-tight text-center text-7xl lg:text-9xl'>Video Splitter</h1>
      <UploadForm setVideoData={setVideoData} setProgress={setProgress} />
      {videoData.name && <div className='max-w-2xl p-4 pb-10 mx-auto bg-gray-900 border border-black rounded-md mt-7'>
        <summary title={videoData.name}>
          <h2 className='flex justify-center text-xl font-bold'>
            <div className='max-w-[25ch] overflow-hidden text-ellipsis'>{videoData.nameWithoutExtension}</div>
            <div>{videoData.fileExtension}</div>
          </h2>
        </summary>
        <div className='mt-3 results-grid'>
          {videoData.splitFiles?.map(({ name, objectUrl }, index) => {
            return <ResultVideo key={`v-${index}`} name={name} objectUrl={objectUrl} index={index} />
          })}
        </div>
      </div>}
    </div>
  );
}

export default App;

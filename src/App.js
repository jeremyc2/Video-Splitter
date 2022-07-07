import React, { useState, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { getType } from 'mime'
import './App.css';

function App() {
  const [videoData, setVideoData] = useState([]);
  const minuteRef = useRef();
  const secondRef = useRef();

  const ffmpeg = createFFmpeg({
    log: false,
  });

  function selectInput(e) {
    e.currentTarget.select()
  }

  const splitFile = async ({ target: { files } }) => {
    const minutes = parseInt(minuteRef.current.value);
    const seconds = parseInt(secondRef.current.value);

    if(isNaN(minutes) || isNaN(seconds)) return;

    const segmentTime = minutes * 60 + seconds;

    const { name } = files[0];
    const fileExtension = name.substring(name.lastIndexOf('.'));
    const mimeType = getType(name);

    await ffmpeg.load();
    ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
    await ffmpeg.run('-i', name, '-f', 'segment', '-segment_time', segmentTime.toString(), '-vcodec', 'copy', '-reset_timestamps', '1', `output_video%d${fileExtension}`);
    const wasmFiles = await ffmpeg.FS('readdir', '.');

    setVideoData([]);
    wasmFiles
      .filter(file => file.startsWith('output_video'))
      .forEach(file => {
        const data = ffmpeg.FS('readFile', file);
        const blob = new Blob([data.buffer], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);

        setVideoData((videoData) => [...videoData, objectUrl]);
      });
  }
  return (
    <div className='App'>
      <div className='watermark'>VS</div>
      <h1 className='mt-10 font-extrabold tracking-tight text-center text-7xl lg:text-9xl'>Video Splitter</h1>
      <form className='p-5 mx-auto mt-10 text-xl bg-gray-900 border border-black rounded-md w-fit'>
        <div className='flex gap-2 mx-auto mb-0 w-fit'>
          <input ref={minuteRef}
            className='p-2 leading-tight text-center text-gray-700 bg-gray-200 border rounded selection:bg-slate-400 border-slate-400 focus:outline-none focus:bg-white'
            type="text" defaultValue='01' maxLength={2} size={2} pattern="\d*" onFocus={selectInput} autoFocus
          />
          <span className='inline-flex h-full text-3xl font-black align-items-center'>:</span>
          <input ref={secondRef}
            className='p-2 leading-tight text-center text-gray-700 bg-gray-200 border rounded selection:bg-slate-400 border-slate-400 focus:outline-none focus:bg-white'
            type="text" defaultValue='00' maxLength={2} size={2} pattern="\d*" onFocus={selectInput}
          />
        </div>
        <label tabIndex='0' role='button' aria-disabled='false' 
          className='block p-2 mx-auto mt-3 font-medium bg-blue-500 rounded-md shadow-sm w-fit hover:bg-blue-400'
        >
          <span>
            Upload Video
            <input type='file' onClick={(e) => e.currentTarget.value = null} onChange={splitFile} className='hidden' />
          </span>
        </label>
      </form>
      <div className='flex flex-wrap max-w-2xl gap-3 p-4 pb-16 mx-auto bg-gray-900 border border-black rounded-md empty:hidden mt-7'>
        {videoData.map((data, index) => {
          return <a key={`v-${index}`} download={`video${index}`}  href={data} 
            className='py-2 font-medium text-center bg-red-500 rounded-md shadow-sm px-7 hover:bg-red-400'
          >Part {index + 1}</a>
        })}
      </div>
    </div>
  );
}

export default App;
import { CircularProgress, Container, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import './App.css';
import Encoder from './pages/encoder/encoder';
import scriptText from './python/bch.py';

const App = () => {
  const [pyodide, setPyodide] = useState(null);

  useEffect(() => {
    const init = async () => {
      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
      });
      pyodide.runPythonAsync(scriptText)
      setPyodide(pyodide);
    }
    init();
  }, []);
  

  if (!pyodide) {
    return (
        <Container maxWidth="lg" sx={{ display: 'grid', placeItems: 'center', zIndex: 2, position: 'relative', height: '100vh', width: '100%' }}>
          <Stack direction='column' alignItems='center' spacing={2} mt='-10%'>
            <CircularProgress />
          </Stack>
        </Container>
    );
  }

  return (
    <Container sx={{ pt: 4, zIndex: 2, position: 'relative', minHeight: '100vh', pb: 4 }}>
      <Encoder pyodide={pyodide} />
    </Container>
  );
}

export default App;

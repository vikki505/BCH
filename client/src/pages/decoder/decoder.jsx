import { Button, Container, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Latex from 'react-latex';
import GfTable from '../../components/gf_table';

const Decoder = ({ encodedMessage, gf, maxErr, systematicCoding, pyodide, deg, px }) => {
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);

  const [corruptedMessage, setCorruptedMessage] = useState('');
  const [syndrome, setSyndrome] = useState(null);

  const findSyndrome = async () => {
    const synd_table = await pyodide.runPythonAsync(`
        synd = calc_syndromes(corrupted_msg, correctable_errors)
        synd_format_table(synd)
    `);
    setSyndrome(synd_table.toJs())
    console.log(synd_table.toJs())
  };

  useEffect(() => {
    randomCorruptedMsg()
  }, [])

  const randomCorruptedMsg = async () => {
    console.log(gf)
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let errPositions = new Set();
    for (let i = 0; i < getRandomInt(1, maxErr + 1); i++) {
      errPositions.add(getRandomInt(0, encodedMessage[1].length - 1));
    }

    console.log(errPositions)
    const corruptedMessage = encodedMessage[1]
      .split('')
      .map((char, index) => (errPositions.has(index) ? (char === '0' ? '\\textcolor{red}{1}' : '\\textcolor{red}{0} ') : char))
      .reverse()
      .join('');
    setCorruptedMessage(corruptedMessage)

    const corruptedInt = parseInt(encodedMessage[1]
      .split('')
      .map((char, index) => (errPositions.has(index) ? (char === '0' ? '1' : '0') : char))
      .reverse()
      .join(''), 2)
    const corrupted = await pyodide.runPythonAsync(`
        corrupted_msg = ${corruptedInt}
        bin(corrupted_msg)[2:].rjust(number_of_elements-1, '0')
    `);
    console.log(corrupted)
  };

  return (
    <>
      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4 }}>
        <Container maxWidth='md'>
          <Stack direction={'column'} spacing={2}>
            <Typography variant='h3' align='center'>Крок 1. Передача повідомлення каналом зв'язку</Typography>
            <Typography variant='h5' align='center'>Параметри коду</Typography>
            <Latex>{'БЧХ-код ' + deg + ' степеня з примітивним мночленом поля: $\\mathit{' + px + '}$.'}</Latex>
            <Typography align='center'>Здатен виправляти помилок: {maxErr}. Тип кодування: {systematicCoding ? 'систематичне' : 'несистематичне'}.</Typography>
            <Typography variant='h5' align='center'>Закодована інформація</Typography>
            <Typography align='center'>Початкове повідомлення</Typography>
            <Latex>{'$' + encodedMessage[1] + '$'}</Latex>
            <Typography align='center'>Повідомлення з помилками після передачі</Typography>
            <Latex>{'$' + corruptedMessage + '$'}</Latex>
            <Button fullWidth variant='contained' disabled={step2} onClick={randomCorruptedMsg}>Змінити випадкову помилку</Button>
            <Button fullWidth variant='contained' disabled={step2} onClick={() => { setStep2(true) }}>Продовжити</Button>
          </Stack>
        </Container>
      </Paper>

      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4 }}>
        <Container maxWidth='md' sx={step2 || { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <Stack direction={'column'} spacing={2}>
            <Typography variant='h3' align='center'>Крок 2. Розрахунок компонент синдрому</Typography>
            <Typography variant='h5' align='center'>Теоретична інформація</Typography>
            <Typography align='center'>іволадліов адлівоадлвіоадлівоадлівомд оідвсоді овсдлівос длосідлв оісдлоділво сдллодчліод воісчдл о</Typography>
            <Typography variant='h5' align='center'>Таблиця елементів поля Галуа</Typography>
            <GfTable gf={gf} />
            <Typography variant='h5' align='center'>Розрахунок синдромів</Typography>
            <Button fullWidth variant='contained' onClick={findSyndrome}>Розрахувати синдроми</Button>
            {syndrome && (
              <>
                <Typography variant='h5' align='center' pt={2}>Компоненти синдрому</Typography>
                <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.45)' }}>
                  <Table size="small" sx={{ maxHeight: 'calc(100vh - 100px)' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Синдром</TableCell>
                        <TableCell>Значення синдрому</TableCell>
                        <TableCell>Двійкове значення синдрому</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {syndrome.map(([a, p, b]) => (
                        <TableRow key={a}>
                          <TableCell><Latex>{'$\\mathit{' + a + '}$'}</Latex></TableCell>
                          <TableCell><Latex>{'$\\mathit{' + p + '}$'}</Latex></TableCell>
                          <TableCell><Latex>{'$\\mathit{' + b + '}$'}</Latex></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* <Latex>{'БЧХ-код ' + deg + ' степеня з примітивним мночленом поля: $\\mathit{' + px + '}$.'}</Latex>
            <Typography align='center'>Здатен виправляти помилок: {maxErr}. Тип кодування: {systematicCoding ? 'систематичне' : 'несистематичне'}.</Typography>
            <Typography variant='h5' align='center'>Закодована інформація</Typography>
            <Typography align='center'>Початкове повідомлення</Typography>
            <Latex>{'$' + encodedMessage[1] + '$'}</Latex>
            <Typography align='center'>Повідомлення з помилками після передачі</Typography>
            <Latex>{'$' + corruptedMessage + '$'}</Latex>
            */}
            <Button fullWidth variant='contained' onClick={() => { setStep2(true) }}>Продовжити</Button>
          </Stack>
        </Container>
      </Paper>
    </>
  );
};

export default Decoder;
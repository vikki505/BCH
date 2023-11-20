import { Button, Container, FormControl, FormControlLabel, InputLabel, MenuItem, Paper, Select, Slider, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { default as React, useState } from 'react';
import Latex from 'react-latex';
import primitives from '../../consts/primitives.json';
import GfTable from '../../components/gf_table';
import Decoder from '../decoder/decoder';

const Gf = ({ pyodide }) => {
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState('3');
  const [selectedPx, setSelectedPx] = useState(primitives[selectedDegree][0]);
  const [gf, setGf] = useState(null);
  const [minPolys, setMinPolys] = useState(null);
  const [generator, setGenerator] = useState(null);
  const [maxErr, setMaxErr] = useState(1);
  const [systematicCoding, setSystematicCoding] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [origMessage, setOrigMessage] = useState('');
  const [encodedMessage, setEncodedMessage] = useState('');
  

  const handleSwitchChange = () => {
    setSystematicCoding((prevValue) => !prevValue);
  };

  const handleDegChange = (event, value) => {
    const selectedDeg = value.toString();
    setSelectedDegree(selectedDeg);
    setSelectedPx(primitives[selectedDeg][0]);
  };

  const handlePxChange = (event) => {
    setSelectedPx(event.target.value);
  };

  const handleMaxErrChange = (event, value) => {
    const err = value;
    findGenerator(err);
    setMaxErr(err);
  };

  const handleMessageChange = (event) => {
    const input = event.target.value;
    const sanitizedInput = input.replace(/[^01]/g, '');
    setInputMessage(sanitizedInput);
  };

  const flushMessage = () => {
    setOrigMessage('')
    setEncodedMessage('')
  }

  const flushParams = () => {
    flushMessage()
    setEncoding(false)
    setInputMessage('')
  }

  const flushMinPolys = () => {
    flushParams()
    setStep3(false)
    setMinPolys(null)
  }

  const flushGf = () => {
    setStep2(false)
    flushMinPolys()
    setGf(null)
  }

  const encodeMsg = async () => {
    const msg_val = parseInt(inputMessage, 2);
    const orig_msg = await pyodide.runPythonAsync(`
      orig_msg = ${msg_val}
      str_poly(orig_msg)
    `);
    setOrigMessage(orig_msg)
    const encoded_msg = await pyodide.runPythonAsync(`
      encoded_message = ${systematicCoding ? 'encode_systematic' : 'encode_unsystematic'}(orig_msg, gx)
      [str_poly(encoded_message), bin(encoded_message)[2:].rjust(number_of_elements-1, '0')]
    `);
    setEncodedMessage(encoded_msg.toJs())
  };

  const findGenerator = async (correctable_errors) => {
    const generator = await pyodide.runPythonAsync(`
        correctable_errors = ${correctable_errors}
        gx = calculate_code_generator(correctable_errors, cyclotomic_classes, minimal_polys)
        [number_of_elements-powerof(gx)-1, powerof(gx), str_poly(gx)]
    `);
    setGenerator(generator.toJs())
  };

  const findMinPolys = async () => {
    const cyclotomic = await pyodide.runPythonAsync(`
      cyclotomic_classes = find_cyclotomic_classes()
      minimal_polys = calculate_minimal_polys(cyclotomic_classes)
      format_minimal_polys(cyclotomic_classes, minimal_polys)
    `);
    setMinPolys(cyclotomic.toJs())
    findGenerator(1)
  }


  const generateField = async () => {
    const gf_result = await pyodide.runPythonAsync(`
      field_power = ${selectedDegree}
      px = ${selectedPx.value}
      number_of_elements = 2**field_power
      poly_by_primitive = [0] * (number_of_elements-1) * 2 
      primitive_by_poly = [1] * number_of_elements
      gf_init_table()
      gf_format_table()
    `);
    const gal_f = { deg: selectedDegree, px: selectedPx, result: gf_result.toJs() }
    setGf(gal_f)
  };

  return (
    <>
      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4 }}>
        {/* <Container maxWidth='md' sx={{filter: 'blur(5px)'}}> */}
        <Container maxWidth='md'>
          <Stack direction={'column'} spacing={2}>
            <Typography variant='h3' align='center'>Крок 1. Розширене поле Галуа</Typography>
            {/* <Typography>Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. </Typography> */}
            {/* <Typography>Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. Теорія про поля галуа. </Typography> */}
            <Typography variant='h5' align='center'>Введіть параметри поля</Typography>
            <Stack direction={'column'} >
              <Typography fontStyle='italic'>Оберіть степінь розширеного поля Галуа</Typography>
              <FormControl fullWidth>
                <Slider
                  disabled={gf}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toString()}
                  step={1}
                  min={2}
                  defaultValue={3}
                  max={8}
                  onChange={handleDegChange}
                  aria-labelledby="slider-a"
                />
              </FormControl>
            </Stack>
            <Stack direction={'column'} pb={2}>
              <Typography fontStyle='italic'>Оберіть примітивний многочлен поля</Typography>
              <FormControl fullWidth style={{ marginTop: '16px' }}>
                <InputLabel>Примітивний поліном</InputLabel>
                <Select
                  disabled={gf}
                  value={selectedPx}
                  onChange={handlePxChange}
                  label="Примітивний поліном"
                >
                  {primitives[selectedDegree].map((Px) => (
                    <MenuItem key={Px.name} value={Px}>
                      <Latex>{'$\\mathit{' + Px.name + '}$'}</Latex>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            {gf ?
              <Button fullWidth variant='contained' onClick={flushGf}>Обрати інші параметри</Button>
              :
              <Button fullWidth variant='contained' onClick={generateField}>Згенерувати поле</Button>}
            {gf && (
              <>
                <Stack direction={'column'} spacing={2} py={2}>
                  <Latex>{'Генеруємо поле $GF(2^{' + gf.deg.toString() + '})$: Позначимо примітивний елемент поля як $\\mathit{α}$. Нехай, $\\mathit{α^0 = 1, α^1 = x, ... , α^n = x^n}$.'}</Latex>
                  <Latex>{'Для всіх $\\mathit{x^{' + gf.deg.toString() + '}}$ виконаємо заміну згідно з примітивним мночленом поля: $\\mathit{' + gf.px.name.replace(/\+/, '=') + '}$.'}</Latex>
                  <Typography variant='h5' align='center'>Таблиця елементів поля Галуа</Typography>
                  <GfTable gf={gf.result} />
                </Stack>
                <Button fullWidth variant='contained' disabled={step2} onClick={() => { setStep2(true) }}>Продовжити</Button>
              </>)}
          </Stack>
        </Container>
      </Paper>


      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4, my: 4 }}>
        <Container maxWidth='md' sx={step2 || { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <Stack direction={'column'}>
            <Stack direction={'column'} spacing={2} mb={4} textAlign={'center'}>
              <Typography variant='h3' align='center' pt={2}>Крок 2. Створення цикломатичних класів</Typography>
              <Typography>Об’єднаємо примітивні елементи у цикломатичні класи за степенями:</Typography>
              <Latex>{'$\\mathit{α^i}$: $\\mathit{C_i=\\{i, 2i, 2^2i, 2^3i,...,2^ki\\}}$.'}</Latex>
              <Typography>Мінімальні многочлени кожного класу обчислсимо за формулою: </Typography>
              <Latex>{'$\\mathit{φ_i(x) =(x+a^i)(x+a^{2i})(x+a^{2^2i})...(x+a^{2^ki})}$.'}</Latex>
            </Stack>
            <Button fullWidth variant='contained' disabled={minPolys} onClick={findMinPolys}>Обчислити мінімальні многочлени</Button>
            {minPolys && (
              <>
                <Stack direction={'column'} spacing={2} mb={4} mt={2}>
                  <Typography variant='h5' align='center' pt={2}>Таблиця мінімальних многочленів за цикломатичними класами</Typography>
                  <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.45)' }}>
                    <Table size="small" sx={{ maxHeight: 'calc(100vh - 100px)' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Класс</TableCell>
                          <TableCell>Сполучені елементи</TableCell>
                          <TableCell>Мінімальний многочлен</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {minPolys.map(([a, p, b]) => (
                          <TableRow key={a}>
                            <TableCell><Latex>{'$\\mathit{' + a + '}$'}</Latex></TableCell>
                            <TableCell><Latex>{'$\\mathit{' + p + '}$'}</Latex></TableCell>
                            <TableCell><Latex>{'$\\mathit{' + b + '}$'}</Latex></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
                <Button fullWidth variant='contained' disabled={step3} onClick={() => { setStep3(true) }}>Продовжити</Button>
              </>
            )}
          </Stack>
        </Container>
      </Paper>


      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4, my: 4 }}>
        <Container maxWidth='md' sx={step3 || { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <Stack direction={'column'} spacing={4}>
            <Typography variant='h3' align='center' pt={2}> Крок 3. Оберіть параметри коду</Typography>
            <Stack direction={'column'} spacing={4}>
              <Stack direction={'row'} spacing={2}>
                <Stack direction={'column'} spacing={1}>
                  <Typography fontStyle='italic'>Оберіть кількість допустимих помилок</Typography>
                  <FormControl fullWidth>
                    <Slider
                      disabled={encoding}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => value.toString()}
                      step={1}
                      min={1}
                      defaultValue={1}
                      max={(2 ** selectedDegree) / 2 - 1}
                      onChange={handleMaxErrChange}
                      aria-labelledby="slider-a"
                    />
                  </FormControl>
                </Stack>
                <Stack direction={'column'} spacing={1}>
                  <Typography fontStyle='italic'>Кількість інформаційних символів:</Typography>
                  {generator && <Typography align='center'>{generator[0]}</Typography>}
                </Stack>
                <Stack direction={'column'} spacing={1}>
                  <Typography fontStyle='italic'>Кількість коригуючих символів:</Typography>
                  {generator && <Typography align='center'>{generator[1]}</Typography>}
                </Stack>
              </Stack>
              <Stack direction={'column'} spacing={1}>
                <Typography fontStyle='italic'> <Latex>{`Породжуючий поліном включатиме класи, які містять елементи від $\\mathit{α^1}$ до $\\mathit{α^{${maxErr * 2}}}$.`}</Latex> </Typography>
                {generator &&
                  <Typography align='center' overflow={"auto"} sx={{
                    '&::-webkit-scrollbar': {
                      width: '5px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#888',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: '#555',
                    },
                  }}>
                    <Latex>{'$\\mathit{g(x)=' + generator[2] + '}$'}</Latex>
                  </Typography>}
                <Stack direction='row' spacing={2} alignItems={'center'} fontStyle={'italic'}>
                  <Typography>Оберіть тип кодування: </Typography>
                  <FormControlLabel
                    control={<Switch checked={systematicCoding} onChange={handleSwitchChange} />}
                    disabled={encoding}
                    label={systematicCoding ? 'Систематичне кодування (інформаційні символи відділені від коригуючих)' : 'Несистематичне кодування (інформаційні символи неможливо відрізнити)'}
                  />
                </Stack>
              </Stack>
              {encoding ?
                <Button fullWidth variant='contained' onClick={flushParams}>Змінити параметри коду</Button>
                :
                <Button fullWidth variant='contained' onClick={() => { setEncoding(true) }}>Продовжити</Button>
              }
            </Stack>
          </Stack>
        </Container>
      </Paper>


      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4, my: 4 }}>
        <Container maxWidth='md' sx={encoding || { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <Stack direction={'column'} spacing={2}>
                <Typography variant='h3' align='center' pt={2}>Крок 4. Введіть повідомлення яке хочете закодувати</Typography>
                <Stack direction={'column'} pb={2} spacing={2}>
                  <Typography fontStyle='italic'>Введіть початкове повідомлення у двійковому вигляді для кодування. {generator && (`Кількість символів: ${generator[0]}`)}.</Typography>
                  <TextField
                    fullWidth
                    disabled={encodedMessage}
                    label="Початкове повідомлення"
                    variant="outlined"
                    id="binaryInput"
                    value={inputMessage}
                    onChange={handleMessageChange}
                    inputProps={{
                      maxLength: generator ? generator[0]: 0,
                      pattern: '[0-1]*',
                    }}
                  />
                </Stack>
                {encodedMessage ?
                  <Button fullWidth variant='contained' onClick={flushMessage}>Змінити початкове повідомлення</Button>
                  :
                  <Button fullWidth variant='contained' onClick={encodeMsg} disabled={inputMessage === ''}>Закодувати повідомлення</Button>}
                {encodedMessage && (
                  <>
                    <Typography variant='h4' align='center' pt={2}>Результат {systematicCoding ? 'систематичного' : 'несистематичного'} кодування</Typography>
                    <Stack direction='column' align="center" spacing={1}>
                      <Typography>Початкове повідомлення: </Typography>
                      <Typography align='center' overflow={"auto"} sx={{
                        '&::-webkit-scrollbar': {
                          width: '5px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: '#888',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          backgroundColor: '#555',
                        },
                      }}>
                        <Latex>{'$\\mathit{u(x)=' + origMessage + '}$'}</Latex>
                      </Typography>
                      <Typography>Формула кодування: </Typography>
                      {systematicCoding ?
                        <Typography align='center'>
                          <Latex>{'$\\mathit{ν(x)=u(x)\\cdot{}x^{' + generator[1] + '}+u(x)\\ {}mod\\ {}g(x)}$'}</Latex>
                        </Typography>
                        :
                        <Typography align='center'>
                          <Latex>{'$\\mathit{ν(x)=u(x)\\cdot{}g(x)}$'}</Latex>
                        </Typography>
                      }
                      <Typography>Закодоване повідомлення (поліном): </Typography>
                      <Typography align='center' overflow={"auto"} sx={{
                        '&::-webkit-scrollbar': {
                          width: '5px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: '#888',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          backgroundColor: '#555',
                        },
                      }}>
                        <Latex>{'$\\mathit{ν(x)=' + encodedMessage[0] + '}$'}</Latex>
                      </Typography>
                      <Typography>Закодоване повідомлення у двійковому вигляді: </Typography>
                      <Latex>{'$' + encodedMessage[1] + '$'}</Latex>
                      <Stack direction={'row'} spacing={1} pt={2}>
                        <Button fullWidth variant='contained' onClick={()=>{}}>Повернутись до меню</Button>
                        <Button fullWidth variant='contained' onClick={()=>{}}>Перейти до декодування</Button>
                      </Stack>
                      {/* <Decoder maxErr={maxErr} pyodide={pyodide} encodedMessage={encodedMessage} gf={gf.result} deg={gf.deg} px={gf.px.name}/> */}
                      {/* {corruptedMsg ?
                      <Button fullWidth variant='contained' onClick={flushCorruptedMsg}>Змінити значення помилки</Button>
                      :
                      <Button fullWidth variant='contained' onClick={randomCorruptedMsg}>Додати випадкову помилку до повідомлення</Button>
                    }
                    {(
                      <>
                        <Typography variant='h5'>Повідомлення після передачі каналом зв'язку: </Typography>
                        <Latex>{'$' + corruptedMsg + '$'}</Latex>
                      </>
                    )} */}
                    </Stack>
                  </>
                )}
          </Stack>
        </Container>
      </Paper >
    </>
  );
};

export default Gf;
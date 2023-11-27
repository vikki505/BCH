import { Button, Container, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Latex from 'react-latex';
import GfTable from '../../components/gf_table';

const Decoder = ({ encodedMessage, gf, maxErr, systematicCoding, pyodide, deg, px, gx, gx_power }) => {
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);
  const [step4, setStep4] = useState(false);
  const [step5, setStep5] = useState(false);

  const [numErr, setNumErr] = useState(maxErr);
  const [corruptedMessage, setCorruptedMessage] = useState(null);
  const [corruptedColorMsg, setCorruptedColorMsg] = useState(null);
  const [syndrome, setSyndrome] = useState(null);
  const [syndromeMatrix, setSyndromeMatrix] = useState(null);
  const [det, setDet] = useState(null);
  const [detMatrix, setDetMatrix] = useState(null);
  const [finalMatrix, setFinalMatrix] = useState(null);
  const [sigma, setSigma] = useState(null);
  const [locatorPoly, setLocatorPoly] = useState(null);
  const [locators, setLocators] = useState(null);
  const [fixedMessage, setFixedMessage] = useState(null);
  const [decodedMessage, setDecodedMessage] = useState(null);

  const decErr = () => {
    setNumErr(prevNumErr => prevNumErr - 1);
  };

  const findSyndrome = async () => {
    const synd_table = await pyodide.runPythonAsync(`
        numErr = ${maxErr}
        synd = calc_syndromes(corrupted_msg, correctable_errors)
        synd_format_table(synd)
    `);
    setSyndrome(synd_table.toJs())
    // console.log(synd_table.toJs())
  };

  const findSyndromeMatrix = async () => {
    const synd_matrix = await pyodide.runPythonAsync(`
      synd_matrix = generate_augmented_matrix(synd, numErr)
      format_aug_matrix(synd_matrix)
    `);
    setSyndromeMatrix(synd_matrix)
    console.log("worked!!")
    // console.log(synd_matrix)
    const det = await pyodide.runPythonAsync(`
      det, triangle_matrix = gf_row_reduce_det(synd_matrix)
      if det==0: numErr-=1
      'α^{' + str(primitive_by_poly[det]) +'}' if det>1 else str(det) 
    `);
    setDet(det)
    // console.log(det)
    const det_matrix = await pyodide.runPythonAsync(`
    format_aug_matrix(triangle_matrix)
    `);
    setDetMatrix(det_matrix)
    if (det !== '0') findFinalMatrix()
  };

  const findFinalMatrix = async () => {
    const final = await pyodide.runPythonAsync(`
      final_matrix = gf_row_reduce_res(triangle_matrix)
      format_aug_matrix(final_matrix)
    `);
    setFinalMatrix(final)
    const sigma = await pyodide.runPythonAsync(`
      format_matrix_answer(final_matrix)
    `);
    setSigma(sigma)
    const loc_poly = await pyodide.runPythonAsync(`
    format_locator_poly(final_matrix)
  `);
    setLocatorPoly(loc_poly)
  };

  const chienSearch = async () => {
    const loc = await pyodide.runPythonAsync(`
      chien_search(final_matrix)
    `);
    console.log(loc.toJs())
    setLocators(loc.toJs())
  };

  const fixErrors = async () => {
    const fixedMessageColor = corruptedMessage
      .split('')
      .reverse()
      .map((char, index) => (locators.includes(index) ? (char === '0' ? '\\textcolor{blue}{1}' : '\\textcolor{blue}{0} ') : char))
      .reverse()
      .join('');
    setFixedMessage(fixedMessageColor)

    const fixed = corruptedMessage
      .split('')
      .reverse()
      .map((char, index) => (locators.includes(index) ? (char === '0' ? '1' : '0') : char))
      .reverse()
      .join('')
    // const fixed_msg_int = parseInt(fixed, 2)
    // console.log(fixed_msg_int)
    await pyodide.runPythonAsync(`
      fixed_message = int("${fixed}", 2)
    `);
  };

  const decodeMessage = async () => {
    let decoded
    if (systematicCoding) {
      decoded = await pyodide.runPythonAsync(`
        bin(fixed_message)[2:].rjust(number_of_elements-1)[:number_of_elements-powerof(gx)+1]
      `)
    } else {
      decoded = await pyodide.runPythonAsync(`
        decoded, _ = div_binary_poly(fixed_message, gx)
        bin(decoded)[2:]
      `)
    }
    setDecodedMessage(decoded)
  };

  const randomCorruptedMsg = async () => {
    // console.log(gf)
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let errPositions = new Set();
    for (let i = 0; i < getRandomInt(1, maxErr); i++) {
      errPositions.add(getRandomInt(0, encodedMessage[1].length - 1));
    }

    // console.log(errPositions)
    const corruptedColorMsg = encodedMessage[1]
      .split('')
      .map((char, index) => (errPositions.has(index) ? (char === '0' ? '\\textcolor{red}{1}' : '\\textcolor{red}{0} ') : char))
      .join('');
    setCorruptedColorMsg(corruptedColorMsg)

    const corruptedMessage = encodedMessage[1]
      .split('')
      .map((char, index) => (errPositions.has(index) ? (char === '0' ? '1' : '0') : char))
      .join('')
    setCorruptedMessage(corruptedMessage)
    console.log(corruptedMessage)

    // const corruptedInt = parseInt(corruptedMessage, 2)
    const corrupted = await pyodide.runPythonAsync(`
        corrupted_msg = int("${corruptedMessage}", 2)
        bin(corrupted_msg)[2:].rjust(number_of_elements-1, '0')
    `);
    console.log(corrupted)
  };

  return (
    <>
      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4 }}>
        <Container maxWidth='md'>
          <Typography variant='h2' fontSize={52} align='center' mt={2} mb={6} px={12} fontWeight={'bold'}>Декодування кодової послідовності БЧХ-коду</Typography>
          <Stack direction={'column'} spacing={2} textAlign={'center'}>
            <Typography variant='h3' fontSize={40} px={12} align='center'>Крок 1. Передача кодової послідовності каналом зв'язку</Typography>
            <Typography variant='h5' align='center'>Параметри БЧХ-коду що відомі декодеру</Typography>
            <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.45)'}}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Параметр</TableCell>
                    <TableCell>Значення</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{fontStyle: 'italic'}}>
                  <TableRow>
                    <TableCell>Ступінь поля Галуа</TableCell>
                    <TableCell>{deg}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Примітивний многочлен поля</TableCell>
                    <TableCell>
                      <Latex>{'$\\mathit{' + px + '}$'}</Latex>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Здатен виправляти помилок</TableCell>
                    <TableCell>{maxErr}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Тип кодування</TableCell>
                    <TableCell>{systematicCoding ? 'Систематичне' : 'Несистематичне'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant='h5' align='center'>Початкове повідомлення</Typography>
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
            }}><Latex>{'$' + encodedMessage[1] + '$'}</Latex></Typography>

            <Button fullWidth variant='contained' disabled={step2} onClick={randomCorruptedMsg}>Внести випадкову помилку</Button>
            {corruptedMessage && <>
              <Typography variant='h5' align='center'>Повідомлення з помилками після передачі</Typography>
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
              }}><Latex>{'$' + corruptedColorMsg + '$'}</Latex></Typography>

              <Button fullWidth variant='contained' disabled={step2} onClick={() => { setStep2(true) }}>Продовжити</Button>
            </>}
          </Stack>
        </Container>
      </Paper>

      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4, my: 4 }}>
        <Container maxWidth='md' sx={step2 || { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <Stack direction={'column'} spacing={2} textAlign='center'>
            <Typography variant='h3' fontSize={40} align='center'>Крок 2. Розрахунок компонент синдрому</Typography>
            <Typography variant='h5' align='center'>Розрахунок синдромів</Typography>
            <Typography align='center'>
              <Latex>{`Представимо отримане повідомлення у вигляді функції $\\mathit{f(x)}$.`}</Latex>
              <Latex>{`Синдром складається з $\\mathit{2t=${maxErr * 2}}$ компонент, які знаходяться шляхом обчислення функції від примітивного елемента. Необхідно підставити у вираз елементи від $\\mathit{a^1}$ до $\\mathit{a^{${maxErr * 2}}}$`}</Latex>
            </Typography>
            <Typography variant='h5' align='center'>Таблиця елементів поля Галуа</Typography>
            <GfTable gf={gf} />
            <Button fullWidth variant='contained' onClick={findSyndrome} disabled={syndrome}>Розрахувати синдроми</Button>
            {syndrome && (
              <>
                <Typography variant='h5' align='center'>Компоненти синдрому</Typography>
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
                <Button fullWidth variant='contained' disabled={step3} onClick={() => { setStep3(true) }}>Продовжити</Button>
              </>)}
          </Stack>
        </Container>
      </Paper>

      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4, my: 4 }}>
        <Container maxWidth='md' sx={step3 || { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <Stack direction={'column'} spacing={2} textAlign='center'>
            <Typography variant='h3' fontSize={40} align='center'>Крок 3. Вирішення ключового рівняння</Typography>
            <Typography variant='h5' align='center'>Ключове рівняння БЧХ-коду</Typography>
            <Typography align='center'>Вирішення ключового рівняння БЧХ-коду виглядає наступним чином: припустимо, шо сталася максимальна кількість помилок при передачі (<Latex>{'$\\mathit{i=t}$'}</Latex>). Тоді, маємо наступне рівняння:</Typography>
            <Latex>
              {`\\(
                    \\begin{bmatrix}
                      S_1 & S_2 & ... & S_i\\\\
                      S_2 & S_3 & ... & S_{i+1}\\\\
                      ... & ... & ... & ...\\\\
                      S_i & S_{i+1} & ... & S_{2i-1}\\\\
                    \\end{bmatrix}
                    \\begin{bmatrix}
                      σ_{i}\\\\
                      σ_{i-1}\\\\
                      ...\\\\
                      σ_{1}\\\\
                    \\end{bmatrix}
                    =
                    \\begin{bmatrix}
                      S_{i+1}\\\\
                      S_{i+2}\\\\
                      ...\\\\
                      S_{2i}\\\\
                    \\end{bmatrix}
                \\)`}
            </Latex>
            <Typography align='center'>Обчислимо детермінант матриці синдромів. Якщо детермінант дорівнює 0 (рівняння не має розв'язку), зменшуємо очікувану кількість помилок на 1 та повторюємо усі дії з матрицею меньшого розміру. </Typography>
            <Typography align='center'>Отримавши ненульовий детермінант, розв'яжемо рівняння та побудуємо поліном локаторів помилок. Якщо усі детермінанти на кожному кроці рівні 0, робимо висновок, що при передачі даних помилок не відбулося.</Typography>
            <Button fullWidth variant='contained' onClick={() => { findSyndromeMatrix() }} disabled={syndromeMatrix}>Розрахувати матрицю синдромів</Button>
            {detMatrix && (
              <>
                <Typography variant='h5' align='center'>Побудуємо розширену матрицю синдромів</Typography>
                <Typography align='center'>Імовірна кількість помилок: {numErr}. Побудуємо матрицю:</Typography>
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
                  <Latex>
                    {`\\(\\mathit{M_{${numErr}}=}\\begin{bmatrix}
                          ${syndromeMatrix}
                        \\end{bmatrix}\\)`}
                  </Latex>
                </Typography>
                <Typography align='center'>Знайдемо визначник матриці методом Гауса, здійснивши елементарні перетворення:</Typography>
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

                  <Latex>
                    {`\\(\\mathit{M_{${numErr}}=}\\begin{bmatrix}
                          ${detMatrix}
                          \\end{bmatrix}\\)`}
                  </Latex>
                </Typography>
                <Latex>{`\\(\\mathit{\\det(M_{${numErr}})=${det}}\\)`}</Latex>
                {locatorPoly ?
                  <>
                    <Typography align='center'>Оскільки визначник матриці ненульовий, можемо розв'язати ключове рівняння.</Typography>
                    <Typography align='center'>Методом Гауса-Жордана обчислсимо коефіцієнти многочлена локаторів помилок:</Typography>
                    <Latex>
                      {`\\(\\mathit{M_{${numErr}}=}\\begin{bmatrix}
                              ${finalMatrix}
                            \\end{bmatrix}\\)`}
                    </Latex>
                    <Typography align='center'>Отже, маємо такі коефіцієнти:</Typography>
                    <Latex>
                      {sigma}
                    </Latex>
                    <Typography align='center'>Поліном локаторів помилок має наступний вигляд:</Typography>
                    <Latex>
                      {`\\(\\mathit{σ(x)=${locatorPoly}}\\)`}
                    </Latex>
                    <Button fullWidth variant='contained' onClick={() => { setStep4(true) }} disabled={step4}>Продовжити</Button>
                  </>
                  :
                  <>
                    <Typography align='center'>Оскільки визначник матриці нульовий - зменшуємо очікувану кількість помилок та будуємо нову матрицю.</Typography>
                    <Button fullWidth variant='contained' onClick={() => {
                      decErr()
                      findSyndromeMatrix()
                    }}>Обчислити нову матрицю</Button>
                  </>
                }
              </>
            )}
          </Stack>
        </Container>
      </Paper >
      <Paper elevation={4} sx={{ minHeight: '70vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4, my: 4 }}>
        <Container maxWidth='md' sx={step4 || { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <Stack direction={'column'} spacing={2} textAlign='center'>
            <Typography variant='h3' fontSize={40} align='center'>Крок 4. Визначення позицій помилок</Typography>
            <Typography align='center'>Знаючи коефіцієнти многочлена локаторів помилок, можна скласти функцію:</Typography>
            <Latex>{'$\\mathit{σ(x) = 1 + σ_1x + σ_2x^2 +...+σ_nx^n}$'}</Latex>
            <Typography align='center'>Для деяких елементів поля Галуа <Latex>{'$\\mathit{α^x}$'}</Latex> значенння функції дорінює <Latex>{'$\\mathit{0}$'}</Latex>. Степінь елемента, оберненого до <Latex>{'$\\mathit{α^x}$'}</Latex>, вкаже на позицію помилки у повідомленні. Тобто, якщо <Latex>{'$\\mathit{σ(α^x) = 0, α^n={a^{-x}}}$'}</Latex>, то <Latex>{'$\\mathit{n}$'}</Latex> — це локатор помилки. </Typography>
            <Typography align='center'>Застосуємо процедуру Ченя для пошуку таких елементів поля, що <Latex>{'$\\mathit{σ(α^x) = 0}$'}</Latex>. Ця процедура виконує повний перебір можливих значень, підставляючи у функцію усі можливі елементи поля Галуа.</Typography>
            <Button fullWidth variant='contained' onClick={chienSearch} disabled={locators}>Знайти локатори помилок</Button>
            {locators && (
              <>
                <Typography align='center'>Підставимо аргументи від <Latex>{'$\\mathit{α^0}$'}</Latex> до <Latex>{`$\\mathit{α^{${2 ** deg - 2}}}$`}</Latex> в многочлен локаторів. У нулях функції визначимо позиції помилок.</Typography>
                <Typography variant='h5' align='center'>Позиції помилок</Typography>
                <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.45)' }}>
                  <Table size="small" sx={{ maxHeight: 'calc(100vh - 100px)' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Нулі функції</TableCell>
                        <TableCell>Обернений елемент</TableCell>
                        <TableCell>Позиція помилки</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {locators.map((l) => (
                        <TableRow key={locators}>
                          <TableCell><Latex>{'$\\mathit{' + `a^{${(2 ** deg) - l - 1}}` + '}$'}</Latex></TableCell>
                          <TableCell><Latex>{'$\\mathit{' + `a^{${l}}` + '}$'}</Latex></TableCell>
                          <TableCell><Latex>{'$\\mathit{' + l + '}$'}</Latex></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button fullWidth variant='contained' onClick={() => { setStep5(true) }} disabled={step5}>Продовжити</Button>
              </>
            )}
          </Stack>
        </Container>
      </Paper >
      <Paper elevation={4} sx={{ minHeight: '30vh', p: 2, background: 'rgba(255, 255, 255, 0.5)', pb: 4, my: 4 }}>
        <Container maxWidth='md' sx={step5 || { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <Stack direction={'column'} spacing={2} textAlign='center'>
            <Typography variant='h3' fontSize={40} align='center'>Крок 5. Виправлення та декодування повідомлення</Typography>
            <Typography align='center'>БЧХ — це двійковий код, і для виправлення помилок достатньо інвертувати біти кодової послідовності на визначених кроком раніше позиціях (позиції пронумеровані починаючи з правої частини помідомлення, відлік ведеться з 0).</Typography>
            <Button fullWidth variant='contained' onClick={fixErrors} disabled={fixedMessage}>Виправити помилки</Button>
            {fixedMessage && <>
              <Typography variant='h5' align='center'>Виправлення помилок у повідомленні</Typography>
              <Typography align='center'>Прийняте повідомлення (з помилками)</Typography>
              <Latex>{'$' + corruptedMessage + '$'}</Latex>
              <Typography align='center'>Виправлене повідомлення</Typography>
              <Latex>{'$' + fixedMessage + '$'}</Latex>
              <Button fullWidth variant='contained' onClick={decodeMessage} disabled={decodedMessage}>Декодувати повідомлення</Button>
              {decodedMessage && <>
                <Typography align='center'>Тип кодування: {systematicCoding ? 'систематичне. Для декодування необхідно видалити біти породжуючого поліному з повідомлення.' : 'несистематичне. Для декодування необхідно поділити повідомлення на породжуючий поліном'}</Typography>
                <Latex>{'$\\mathit{g(x) =' + gx + '}$'}</Latex>
                <Typography align='center'>Декодоване повідомлення:</Typography>
                <Latex>{'$' + decodedMessage + '$'}</Latex>
                {/* <Button fullWidth variant='contained' onClick={() => { }}>Повернутись до меню</Button> */}

              </>}
            </>}

          </Stack>
        </Container>
      </Paper>

    </>
  );
};

export default Decoder;
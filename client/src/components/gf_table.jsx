import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Latex from 'react-latex';

const GfTable = ({ gf }) => {
  return (
    <TableContainer component={Paper} sx={{background: 'rgba(255, 255, 255, 0.45)'}}>
      <Table size="small" sx={{ maxHeight: 'calc(100vh - 100px)' }}>
        <TableHead>
          <TableRow>
            <TableCell>Примітивний елемент</TableCell>
            <TableCell>Елемент поля (многочлен)</TableCell>
            <TableCell>Елемент поля (двійковий запис)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {gf.map(([a, p, b]) => (
            <TableRow key={a}>
              <TableCell><Latex>{'$\\mathit{' + a + '}$'}</Latex></TableCell>
              <TableCell><Latex>{'$\\mathit{' + p + '}$'}</Latex></TableCell>
              <TableCell><Latex>{'${' + b + '}$'}</Latex></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GfTable;
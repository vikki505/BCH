import { Button, Card, Container, Divider, Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';

const MainPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant='h2' mt={4}>Програмний комплекс кодування/декодування циклічних кодів</Typography>
      <Stack direction='column' spacing={1} mt={2}>
        <Typography variant='h5'>Виконала: Ковальова Вікторія, ІКМ-921б</Typography>
        <Typography variant='h5'>Науковий керівник: Крилова Вікторія</Typography>
      </Stack>
      <Stack direction='column' spacing={4} mt={2}>
        <Divider></Divider>
        <Grid container>
          <Grid item lg={6} md={12} pt={2} pr={2}>
            <Typography variant='h3'>Створення поля Галуа</Typography>
            <Typography variant='h5'>З цим тренажером ви зможете зробити ...</Typography>
            {/* <Button variant='contained' fullWidth>Перейти до тренажеру</Button> */}
          </Grid>
          <Grid item lg={6} md={12} pt={2}>
            <Card elevation={8} sx={{ height: 450, cursor: 'pointer', display: 'grid', placeItems: 'center' }} component={Link} to={'/gf'}>
              <Typography>Перейти до калькулятора...</Typography>
            </Card>
          </Grid>
        </Grid>
        <Divider></Divider>
        <Grid container>
          <Grid item lg={6} md={12} pt={2} pr={2}>
            <Card elevation={8} sx={{ height: 450, cursor: 'pointer', display: 'grid', placeItems: 'center' }} >
              <Typography>Перейти до калькулятора...</Typography>
            </Card>
          </Grid>
          <Grid item lg={6} md={12} pt={2}>
            <Typography variant='h3'>Кодування БЧХ кодів</Typography>
            <Typography variant='h5'>З цим тренажером ви зможете зробити ...</Typography>
          </Grid>
        </Grid>
        <Divider></Divider>
        <Grid container>
          <Grid item lg={6} md={12} pt={2} pr={2}>
            <Typography variant='h3'>Декодування БЧХ кодів</Typography>
            <Typography variant='h5'>З цим тренажером ви зможете зробити ...</Typography>
          </Grid>
          <Grid item lg={6} md={12} pt={2}>
            <Card elevation={8} sx={{ height: 450, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Typography>Перейти до калькулятора...</Typography>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>

  );
};

export default MainPage;
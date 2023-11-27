const scriptText = `

def func(x, y):
    return x+y

def powerof(binary_poly):
    """Макс. степінь многочлена заданого в двійковій формі
       0b1011 -> 'x^3 + x + 1. Оскільки маємо x^3 - виведеться 3
    """
    return binary_poly.bit_length() - 1


def str_poly(bin_poly):
    """Конвертація многочлена з двійкової форми в строкову: 0b1011 -> 'x^3 + x + 1'"""
    additives = []
    power = 0

    
    while bin_poly > 0:
        if bin_poly & 1:
          if power == 0:
              ad = '1'
          elif power == 1:
              ad = 'x'
          else:
              ad = 'x^{'+str(power)+'}'
          additives.insert(0, ad)
        bin_poly >>= 1
        power += 1
    return " + ".join(additives)

def gf_init_table():
    """Заповнення таблиць логарифмів та степенів для GF(2^m)"""
    global px
    global primitive_by_poly
    global poly_by_primitive

    max_poly = (1<<field_power) # Якщо GF(2^3) - то ця змінна = 1000 (тобто x^3)
    
    # Нехай 'а' - примітивний елемент поля GF(2^m). В циклі нижче маємо: i - степінь примітивного елемента, 
    # field_element - значення елемента поля, може бути визначено як а^i, де а - примітивний елемент поля. 
    for stepen in range(number_of_elements - 1):
        if stepen == 0:
            # a^0 = 1
            polinom = 1
        else:
            # a^1 = x, a^2 = x^2, a^3 = x^3, a^4 = x^4, ...
            polinom <<=  1
            # Якщо степінь многочлена елемента вища або дорінює степеню поля маємо провести заміну
            if powerof(polinom) >= field_power:
                # Для прикладу візьмемо GF(2^3) з примітивним многочленом p = x^3+x+1 (0b1011).
                # Відомо, що для примітивного елемента а->x, a^3+a+1=0 -> x^3+x+1=0, x^3=x+1 
                # Іншими словами, максимальний степінь p (x^3) дорівнює решті його виразу (x+1)
                
                # Отже, нам треба відняти макс. степінь p і додати залишок p без найвищого степеня
                
                # Многочлен p задається у двійковій формі p=x^3+x+1 <-> (0b1011).
                # Нам треба розділити старший розряд 0b1000 (тобто x^3) та залишок 0b0011 (тобто x+1)
                # Кількість елементів поля GF(2^m) (що обчислюється як 2^m) якраз відповідає старшому розряду 0b100 
                # Щоб отримати залишок використаємо оператор AND над маскою всіх нижчих ступенів.
                # Така маска виходить якщо відняти від 2^m одиницю і дорівнює 0b0111.
                
                polinom = (polinom - max_poly) ^ (px & (max_poly-1))

        poly_by_primitive[stepen] = polinom
        # Таблиця степенів має подвійний розмір для зручності множення елементів
        poly_by_primitive[stepen+number_of_elements-1] = polinom

        primitive_by_poly[polinom] = stepen

def gf_format_table():
    gf_table = [['0', '0', '0'*field_power]]
    for i in range(number_of_elements-1):
      a = 'α^{' + str(i) + '}'
      p = str_poly(poly_by_primitive[i])
      b = bin(poly_by_primitive[i])[2:].rjust(field_power, '0')
      gf_table.append([a, p, b])
    return gf_table

def synd_format_table(synd):
    synd_table = []
    for i in range(len(synd)):
      synd_index = 'S_{' + str(i+1) + '}'
      synd_a = 'α^{' + str(primitive_by_poly[synd[i]]) + '}'
      synd_bin = bin(synd[i])[2:].rjust(field_power, '0')
      synd_table.append([synd_index, synd_a, synd_bin])
    return synd_table

def format_minimal_polys(cyclotomic_classes, minimal_polys):
    result = []
    for i in range(len(minimal_polys)):
        result.append(['C_{'+str(cyclotomic_classes[i][0])+'}', ', '.join('a^{'+str(el)+'}' for el in cyclotomic_classes[i]), str_poly(minimal_polys[i])])
    return result


def gf_div(a,b):
    """Ділення в полі GF(2^m)"""
    if b == 0:
        raise ZeroDivisionError()
    if a == 0:
        return 0
    return poly_by_primitive[(primitive_by_poly[a] - primitive_by_poly[b] + (number_of_elements-1) )]  

def gf_mul(a,b):
    """Множення в полі GF(2^m)"""
    if a == 0 or b == 0:
        return 0
    # p^n * p^m = p^(n+m), де p - примітивний елемент, a = p^n, b = p^m
    return poly_by_primitive[primitive_by_poly[a] + primitive_by_poly[b]]

def gf_pow(x, power):
    """Зведення в степінь в полі GF(2^m)"""
    if x == 0:
        return 0
    return poly_by_primitive[(primitive_by_poly[x] * power) % (number_of_elements-1)]

def gf_inv(x):
    """Обернений елемент (1/x) в полі GF(2^m)"""
    return gf_div(1, x)


def find_cyclotomic_classes():
    """
    Знайти циклотомічні класи поля GF(2^m).
    
    :return: Список циклотомічних класів, де кожен клас - це список ступенів a.
    """
    degrees = [*range(0, number_of_elements-1)] # Створюэмо список ступенів а
    cyclotomic_classes = [] 

    while degrees:
      multiplier = 1
      degree = degrees.pop(0)
      cyclotomic_class = [degree]

      for _ in range(number_of_elements-1): #should be 'while degrees'
        multiplier *= 2 # 1, 2, 2^2, 2^3
        element = (degree * multiplier) % (number_of_elements-1)
        # print(f"Mul: {multiplier}, Element: {element}, Class: {cyclotomic_class}")
        if element in cyclotomic_class: 
            # print('broke')
            break
        cyclotomic_class.append(element)
        degrees.remove(element)
        
      cyclotomic_classes.append(cyclotomic_class)

    # print(cyclotomic_classes)
    return cyclotomic_classes

def calculate_minimal_polys(cyclotomic_classes):
    """
    Знайти мінімальні многочлени в полі GF(2^m) по заданим циклотомічним класам.
    
    :param cyclotomic_classes: list[list] : Список циклотомічних класів.
    :return: Список мінімальних поліномів.
    """
    minimal_polys = []

    for cyclotomic_class in cyclotomic_classes:
      min_poly = 1
      for degree in cyclotomic_class:
        # Мінімальний многочлен φ(х) = (х + a1)(х + a2)(х + a3), де а - елементи циклотомічного класу
        min_poly = gf_mul(min_poly, (0b10 ^ poly_by_primitive[degree]))
        # min_poly = multiply_polynomials_GF2((0b10 ^ gf_exp[degree]), min_poly)

        # Код вище має ймовірність зламатися, треба враховувати
      if min_poly < 2**len(cyclotomic_class):
          min_poly ^= px # Фікс обмежень множення в полі Галуа
      minimal_polys.append(min_poly)

    return minimal_polys

def div_binary_poly(a, b):
    a_degree = powerof(a)  # Степень старшего разряда делимого
    b_degree = powerof(b)  # Степень старшего разряда делителя

    result = 0
    remainder = a
    while a_degree >= b_degree:
        # Вычисляем разницу степеней и сдвигаем делитель
        degree_difference = a_degree - b_degree
        shifted_divisor = b << degree_difference

        # Вычитаем сдвинутый делитель из делимого
        remainder ^= shifted_divisor

        # Обновляем степень старшего разряда делимого
        a_degree = powerof(remainder)

        # Обновляем результат деления
        result ^= 1 << degree_difference

    return result, remainder
    # return remainder

def encode_unsystematic(message, gx):
    """ Несистематичне БЧХ-кодування

    :param message: Повідомлення (в двійковій формі).
    :param gx: Породжуючий поліном (в двійковій формі).
    """
    return multiply_polynomials_GF2(message, gx)

def encode_systematic(message, gx):
    """ Систематичне БЧХ-кодування

    :param message: Повідомлення (в двійковій формі).
    :param gx: Породжуючий поліном (в двійковій формі).
    """
    message <<= powerof(gx)
    print(f'Зсунуте повідомлення: {str_poly(message)}')
    _, rx = div_binary_poly(message, gx)
    print(f'Надлишкові символи: {str_poly(rx)}')
    return message + rx


def gf_matrix_determinant(matrix):
    """Визначник матриці в полі GF(2^m)"""
    if len(matrix) != len(matrix[0]):
      raise ValueError('Matrix should be square')
    if len(matrix) == 2:
      return gf_mul(matrix[0][0], matrix[1][1]) ^ gf_mul(matrix[0][1], matrix[1][0])    
    det = 0
    for j in range(len(matrix)):
        minor = [row[:j] + row[j+1:] for row in matrix[1:]]
        subdet = gf_matrix_determinant(minor)
        det ^= gf_mul(matrix[0][j], subdet)
          
    return det


def calculate_code_generator(number_of_errors, cyclotomic_classes, minimal_polys):
    """Обчислення породжуючого полінома відповідно до кількості помилок"""
    number_of_generator_roots = number_of_errors * 2
    
    minimal_polys_dict = {}
    for keys, value in zip(cyclotomic_classes, minimal_polys):
      for key in keys:
        minimal_polys_dict[key] = value

    generator_poly_parts = set()
    
    for power_of_a in range(1, number_of_generator_roots+1):
      generator_poly_parts.add(minimal_polys_dict[power_of_a])

    gx = 1
    for part in generator_poly_parts:
      gx = multiply_polynomials_GF2(gx, part)
    
    return gx

def multiply_polynomials_GF2(poly1, poly2):
  """Перемноження поліномів в простому полі Галуа GF(2).
  На відміну від GF(2^m), степінь результату необмежений."""
  result = 0
  while poly2 > 0:
    if poly2 & 1: 
        result ^= poly1
    poly1 <<= 1
    poly2 >>= 1
  return result


def degrees_of(poly):
    """Ітератор по ненульовим ступеням полінома
    :param poly: Поліном (в двійковій формі)."""
    degree = 0
    while poly > 0:
        if poly & 1:
            yield degree
        poly >>= 1
        degree += 1

def calc_syndromes(message, number_of_errors):
    """Обчислимо компоненти синдрому помилок Sj = f(ai)"""
    number_of_syndrones = number_of_errors * 2
    syndromes = [0] * (number_of_syndrones)
    for i in range(number_of_syndrones):
      primitive_degree = i+1
      synd = 0
      for power in degrees_of(message):
          # Підставляємо (a^i -> x) у кодову послідовність f(x)
          synd ^= poly_by_primitive[(power*primitive_degree)%(number_of_elements-1)] 
      syndromes[i] = synd
    return syndromes

def format_aug_matrix(matrix):
    res = ''
    for row in matrix:
      str_row = list(map(lambda x: 'α^{' + str(primitive_by_poly[x]) +'}' if x>1 else str(x), row))
      modified_row = str_row[:-1] + ["\\\\bigm|"] + [str_row[-1]]
      res += '&'.join(modified_row) + '\\\\\\\\'
    return res

def format_matrix_answer(matrix):
    sigma = ''
    for i in range(len(matrix)):
       sigma += 'σ_{' + str(len(matrix)-i) + '}\\\\\\\\'
    alpha = ''
    for row in matrix:
      # str_row = list(map(lambda x: bin(x)[2:].rjust(field_power, '0'), row))
      alpha += 'α^{' + str(primitive_by_poly[row[-1]]) +'}' if row[-1]>1 else str(row[-1])
      alpha += '\\\\\\\\'
    # print(sigma)
    # print(res)
    res = '\\\\(\\\\begin{bmatrix'+'}'+sigma+'\\\\end{bmatrix'+'}'+'='+'\\\\begin{bmatrix'+'}'+alpha+'\\\\end{bmatrix'+'}\\\\)'
    return res

def format_locator_poly(matrix):
    res = '1'
    for i in range(len(matrix)):
      res += ' + ' 
      res += 'a^{' + str(primitive_by_poly[matrix[-i-1][-1]]) +'}' if matrix[-i-1][-1]>1 else str(matrix[-i-1][-1])
      res += 'x^{' + str(i+1) + '}' if i+1>=2 else 'x'
    return res

def generate_augmented_matrix(synd, matrix_size):
  matrix = [[0 for _ in range(matrix_size+1)] for _ in range(matrix_size)]
  # primitive_powers_matrix = [[0 for _ in range(matrix_size+1)] for _ in range(matrix_size)]
  for i in range(matrix_size):
     matrix[i] = synd[i:i+matrix_size+1]
     # primitive_powers_matrix[i] = [primitive_by_poly[i] for i in matrix[i]]
  return matrix #, primitive_powers_matrix

def gf_row_reduce_det(original_matrix):
  """Метод Гауса в полі GF(2^m)"""
  # Deep copy matrix
  matrix = [i.copy() for i in original_matrix]
  height = len(matrix)
  width = len(matrix[0])

  # if height > width:
  #   raise ValueError('Matrix should be N x (N+M)')
  
  for focus in range(height): # Прямий хід: отримуємо трикутну матрицю
    if matrix[focus][focus] == 0: # Якщо на діагоналі знайдено нульовий елемент...
      for nonzero_element in range(focus+1, height):  # ...то перевіряємо всі рядки нижче
        if matrix[nonzero_element][focus] != 0:  # ...і знаходимо такий рядок, де на цьому місці стоїть ненульовий елемент
          matrix[focus], matrix[nonzero_element] = matrix[nonzero_element], matrix[focus] # Міняємо ці рядки місцями
          break
      else:
        # continue
        return 0, matrix
        # Якщо такий рядок не знайдено (усі вони нульові), то висначник матриці дорівнює 0
        # raise ValueError('Matrix is Singular')
    
    for row_below in range(focus+1, height):
      coefficient = gf_div(matrix[row_below][focus], matrix[focus][focus])
      for row_element in range(focus, width):
        matrix[row_below][row_element] ^= gf_mul(matrix[focus][row_element], coefficient) 

  det = 1
  for i in range(height):  
    det = gf_mul(det, matrix[i][i])
    
  return det, matrix


def gf_row_reduce_res(original_matrix):
  """Метод Гауса-Жордана в полі GF(2^m)"""
  # Deep copy matrix
  matrix = [i.copy() for i in original_matrix]
  height = len(matrix)
  width = len(matrix[0])


  for focus in range(height-1, -1, -1): # Зворотній хід: отримуємо одиничну матрицю
    focus_value = matrix[focus][focus]
    for row_above in range(focus):
      for row_element in range(width-1, focus-1, -1):
        coefficient = gf_div(matrix[row_above][focus], focus_value)
        matrix[row_above][row_element] ^= gf_mul(matrix[focus][row_element], coefficient)
    matrix[focus][focus] = gf_div(matrix[focus][focus], focus_value)
    for augmented_part in range(height, width):
      matrix[focus][augmented_part] = gf_div(matrix[focus][augmented_part], focus_value)
      
  return matrix

def chien_search(matrix):
  locators = []
  for x in range(1, number_of_elements): # Підставляємо усі ступені а у вираз
    locator = 1
    for x_degree in range(0, len(matrix)):
      locator ^= gf_mul(gf_pow(poly_by_primitive[x], x_degree+1), matrix[-x_degree-1][-1])
    if locator==0: locators.append(number_of_elements-1-x)
  return locators

`

export default scriptText
import random
import math
import os

def generate_closest_pair_input(num_points):
    x_min, x_max = 0, 250
    y_min, y_max = 0, 120
    points = []
    
    for _ in range(num_points):
        x = random.randint(x_min, x_max)
        y = random.randint(y_min, y_max)
        points.append((x, y))
    
    return points

def generate_karatsuba_input():
    num_digits = random.randint(5, 10)
    first_number = random.randint(10**(num_digits-1), 10**num_digits - 1)
    second_number = random.randint(10**(num_digits-1), 10**num_digits - 1)
    return first_number, second_number

def save_input_to_file(file_path, input_data):
    with open(file_path, 'w') as file:
        for line in input_data:
            file.write(" ".join(map(str, line)) + "\n")

def generate_test_cases():
    output_directory = "generated_test_files"
    os.makedirs(output_directory, exist_ok=True)

    for file_index in range(10):
        num_points = random.randint(101, 115)
        points_data = generate_closest_pair_input(num_points)
        save_input_to_file(f"{output_directory}/closest_pair_{num_points}_{file_index}.txt", points_data)

        first_number, second_number = generate_karatsuba_input()
        save_input_to_file(f"{output_directory}/karatsuba_{first_number}_{second_number}_{file_index}.txt", [(first_number, second_number)])

if __name__ == "__main__":
    generate_test_cases()
    print("Test files generated successfully!")
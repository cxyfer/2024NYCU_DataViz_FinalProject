import os
import json
import re
import pandas as pd
from pathlib import Path

def load_and_merge_json_files(directory = "./data/json"):
    merged_data = {}
    json_dir = Path(directory)
    
    if not os.path.exists(directory):
        print(f"Warning: Directory {directory} does not exist")
        return merged_data
    
    json_files = sorted(json_dir.glob("*.json"))
    
    if not json_files:
        print(f"Warning: No JSON files found in {directory}")
        return merged_data
    
    # Regex pattern for administrative divisions
    pattern = r'^(.{2,}?[市縣])(.{1,}?[鄉鎮市區])(.{1,}?[村里])$'
    
    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            file_data = json.load(f)
            for key, value in file_data.items():
                match = re.match(pattern, key)
                """
                忽略以下：
                嘉義市東區各里平地、山地原住民
                嘉義市西區各里平地、山地原住民
                """
                if not match:
                   print(key)
                   continue

                new_key = '-'.join(match.groups())
                new_key = new_key.replace("前鎮-區", "前鎮區-")
                merged_data[new_key] = value
                merged_data[new_key]["name"] = new_key
    
    return merged_data

def load_income_data(csv_file="./data/110_165-9.csv"):
    """
    Load income data from CSV file and return as dictionary
    Keys will be formatted as 'city-district-village' to match JSON data
    """
    # Try different encodings and handle BOM
    df = pd.read_csv(csv_file, encoding='utf-8-sig')
    # Clean column names by removing BOM and whitespace
    df.columns = df.columns.str.replace('\ufeff', '').str.strip()
    
    income_data = {}
    # Updated pattern to include 鄉/鎮/市/區
    pattern = r'^(.+?[市縣])(.+?[鄉鎮市區])$'
    
    for _, row in df.iterrows():
        city_district = row['縣市別']
        village = row['村里']
        if city_district.endswith("其他") or village in ["其他", "合計"]:
            continue
        
        match = re.match(pattern, city_district)
        if not match:
            print(f"Warning: Could not parse {city_district}")
            continue
            
        city, district = match.groups()
        key = f"{city}-{district}-{village}"
        
        income_data[key] = {
            'households': row['納稅單位(戶)'],
            'total_income': row['綜合所得總額'],
            'mean': row['平均數'],
            'median': row['中位數'],
            'q1': row['第一分位數'],
            'q3': row['第三分位數'],
            'std': row['標準差'],
            'cv': row['變異係數']
        }
    
    return income_data

def load_education_data(csv_file="./data/revnew.csv"):
    """
    Load education data from CSV file and return as dictionary
    Keys will be formatted as 'city-district-village' to match JSON data
    """
    df = pd.read_csv(csv_file, encoding='utf-8-sig', skiprows=1)
    df.columns = df.columns.str.replace('\ufeff', '').str.strip()

    # print(df.columns)
    
    education_data = {}
    pattern = r'^(.+?[市縣])(.+?[鄉鎮市區])$'
    
    for _, row in df.iterrows():
        city_district = row['區域別']
        village = row['村里名稱']

        city_district = city_district.replace("　", "") \
            .replace("鳳山一", "鳳山區").replace("鳳山二", "鳳山區") \
            .replace("三民一", "三民區").replace("三民二", "三民區") \
        
        match = re.match(pattern, city_district)
        if not match:
            print(f"Warning: Could not parse {city_district}")
            continue
            
        city, district = match.groups()
        key = f"{city}-{district}-{village}"
        
        # Extract relevant columns for higher education statistics
        higher_education_columns = [
            '博畢_男', '博畢_女', '博肄_男', '博肄_女',
            '碩畢_男', '碩畢_女', '碩肄_男', '碩肄_女',
            '大畢_男', '大畢_女', '大肄_男', '大肄_女'
        ]
        
        # Store the total higher education data in the dictionary
        higher_education = sum(row[col] for col in higher_education_columns)
        education_data[key] = {
            "total_population": row['總計'],
            "higher_education": higher_education,
            "rate": higher_education / row['總計']
        }
    
    return education_data

def merge_data(json_data, income_data, column_name):
    absent_keys = []
    for key, value in income_data.items():
        if key in json_data:
            json_data[key][column_name] = value
        else:
            absent_keys.append(key)
    return json_data, absent_keys

if __name__ == "__main__":
    json_data = load_and_merge_json_files()
    income_data = load_income_data()
    education_data = load_education_data()

    merged_data, absent_keys1 = merge_data(json_data, income_data, "income")
    merged_data, absent_keys2 = merge_data(merged_data, education_data, "education")

    with open("./data/data.json", "w", encoding="utf-8") as f:
        json.dump(merged_data, f, ensure_ascii=False, indent=4)

    absent_keys = list(set(absent_keys1 + absent_keys2))

    with open("./data/absent_keys.txt", "w", encoding="utf-8") as f:
        for key in absent_keys:
            f.write(key + "\n")

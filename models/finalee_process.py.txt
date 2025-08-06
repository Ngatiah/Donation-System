import pandas as pd
from sklearn.preprocessing import LabelEncoder
from dateutil import parser
from datetime import datetime
import joblib
import ast # New import for safely evaluating string representations of lists

# === Load and preprocess donor data ===
df = pd.read_excel('./dataset ML.ods', engine='odf')
df.columns = df.columns.str.strip().str.lower()
df.drop_duplicates(inplace=True)
df.rename(columns={'expiry date': 'expiry_date'}, inplace=True)

required_columns = ['food_type', 'tons_surplus', 'expiry_date', 'city', 'lat', 'lng']
for col in required_columns:
    if col not in df.columns:
        raise KeyError(f"Missing expected donor column: {col}")

def parse_expiry(raw_date):
    try:
        return parser.parse(str(raw_date), fuzzy=True)
    except:
        return pd.NaT

df['expiry_date'] = df['expiry_date'].apply(parse_expiry)
df = df[df['expiry_date'] > datetime.now()].copy()
df.rename(columns={'tons_surplus': 'surplus_quantity'}, inplace=True)
df['food_type'] = df['food_type'].astype(str).str.strip().str.lower()
df['city'] = df['city'].str.strip().str.title()

# (Shelf map and shelf_type logic as before - unchanged)
# shelf_map = {
#     'dry goods': 'shelf-stable',
#     'produce': 'perishable',
#     'breads & bakery': 'perishable',
#     'dairy & eggs': 'refrigerated',
#     'ready-to-drink beverages': 'shelf-stable',
#     'fresh meat & seafood': 'refrigerated',
#     'frozen': 'frozen',
#     'prepared foods': 'refrigerated',
# }
# df['shelf_type'] = df['food_type'].map(shelf_map)


# Donor food type encoding (still single for donors)
le_food_donor = LabelEncoder() # Use a distinct name for clarity
df['food_type_encoded'] = le_food_donor.fit_transform(df['food_type'])


# Collect ALL unique food types across donors and (potential) recipients
# This will be used to ensure consistent encoding if you ever need to map food types
all_possible_food_types = df['food_type'].unique().tolist() # Start with donor food types

print(all_possible_food_types)
raw_cities = df['city'].dropna().astype(str).str.strip().str.title().unique()
all_cities_tocoords = df[['city', 'lat', 'lng']].dropna().drop_duplicates()
all_cities_tocoords['city'] = all_cities_tocoords['city'].astype(str).str.strip().str.title()
all_coords_to_cities = all_cities_tocoords.sort_values(by='city').set_index('city')
all_cities = sorted(raw_cities)

joblib.dump(raw_cities, 'all_cities_finalee2.pkl')
joblib.dump(all_coords_to_cities, 'all_cities_tocoords_finalee2.pkl')
joblib.dump(le_food_donor, 'food_encoder_donor_finalee2.pkl') # Save donor encoder


# === Simulate recipient data with MULTI-SELECTION ===
# IMPORTANT: This now reflects the list of food types from your JSONField
# recipient_data = [
#     {'food_type': ['maize', 'rice'], 'city': 'Nairobi', 'urgency': 'high', 'required_quantity': 0.5},
#     {'food_type': ['beans'], 'city': 'Mombasa', 'urgency': 'medium', 'required_quantity': 0.3},
#     {'food_type': ['rice', 'dairy', 'maize'], 'city': 'Kisumu', 'urgency': 'low', 'required_quantity': 1.0},
#     {'food_type': [], 'city': 'Eldoret', 'urgency': 'low', 'required_quantity': 0.8},
#     {'food_type': ['beans'], 'city': 'Eldoret', 'urgency': 'high', 'required_quantity': 100.0}, # 
# ]

recipient_data = [
    {'food_type': ['maize', 'rice'], 'city': 'Nairobi',  'required_quantity': 0.5},
    {'food_type': ['beans'], 'city': 'Mombasa',  'required_quantity': 0.3},
    {'food_type': ['rice', 'dairy', 'maize'], 'city': 'Kisumu', 'required_quantity': 1.0},
    {'food_type': [], 'city': 'Eldoret', 'required_quantity': 0.8},
    {'food_type': ['beans'], 'city': 'Eldoret','required_quantity': 100.0}, 
    {'food_type': ['produce'], 'city': 'Mombasa','required_quantity': 50.0}, 
    {'food_type': ['beans'], 'city': 'Kimilili','required_quantity': 200.0}, 
    {'food_type': ['breads & bakery'], 'city': 'Nakuru','required_quantity': 50.0}, 
    {'food_type': ['breads & bakery'], 'city': 'Kisumu','required_quantity': 290.0}, 
    {'food_type': ['breads & bakery'], 'city': 'Nairobi','required_quantity': 290.0}, 
    {'food_type': ['breads & bakery'], 'city': 'Mombasa','required_quantity': 390.0}, 
    {'food_type': ['beans'], 'city': 'Kisumu','required_quantity': 100.0}, 
    {'food_type': ['dairy & eggs'], 'city': 'Kisumu','required_quantity': 200.0}, 
    {'food_type': ['dairy & eggs'], 'city': 'Nakuru','required_quantity': 350.0}, 
    {'food_type': ['fresh meat & seafood'], 'city': 'Nakuru','required_quantity': 50.0}, 
    {'food_type': ['fresh meat & seafood'], 'city': 'Kisumu','required_quantity': 40.0}, 
    {'food_type': ['fresh meat & seafood'], 'city': 'Nairobi','required_quantity': 40.0}, 
    {'food_type': ['fresh meat & seafood'], 'city': 'Mombasa','required_quantity': 40.0}, 
    {'food_type': ['fresh meat & seafood'], 'city': 'Bungoma','required_quantity': 40.0}, 
    {'food_type': ['dry goods'], 'city': 'Wajir','required_quantity': 1020.0}, 
    {'food_type': ['dry goods'], 'city': 'Kabarnet','required_quantity': 1020.0}, 
    {'food_type': ['dairy & eggs'], 'city': 'Kabarnet','required_quantity': 1020.0},
    {'food_type': ['maize'], 'city': 'Kakamega','required_quantity': 1020.0}, 
    {'food_type': ['dry goods'], 'city': 'Thika','required_quantity': 1020.0}, 
    {'food_type': ['dry goods'], 'city': 'Migori','required_quantity': 1020.0}, 
    {'food_type': ['bread & bakery'], 'city': 'Hola','required_quantity': 2560.0}, 
    {'food_type': ['bread & bakery'], 'city': 'Nyeri','required_quantity': 2560.0}, 
    {'food_type': ['fresh meat & seafood'], 'city': 'Wajir','required_quantity': 40.0}, 
    {'food_type': ['fresh meat & seafood'], 'city': 'Mwatate','required_quantity': 2560.0}, 
    {'food_type': ['bread & bakery'], 'city': 'Mwatate','required_quantity': 2560.0}, 
    {'food_type': ['bread & bakery'], 'city': 'Hola','required_quantity': 2560.0}, 
    {'food_type': ['bread & bakery'], 'city': 'Nyeri','required_quantity': 2560.0}, 

]

df_recipients = pd.DataFrame(recipient_data)

# Normalize recipient food types (lowercase, strip)
# This requires iterating through lists
df_recipients['food_type'] = df_recipients['food_type'].apply(
    lambda x: [ft.strip().lower() for ft in x] if isinstance(x, list) else []
)

# Extend the list of all possible food types from recipients
# This flattens the list of lists
for food_list in df_recipients['food_type']:
    for food_item in food_list:
        if food_item not in all_possible_food_types:
            all_possible_food_types.append(food_item)

# Sort for consistency
all_possible_food_types.sort()
joblib.dump(all_possible_food_types, 'all_food_types_list_finalee2.pkl') # Save the master list


# Merge lat/lng for recipients
df_recipients = df_recipients.merge(
    all_coords_to_cities.reset_index()[['city', 'lat', 'lng']],
    on='city',
    how='left'
)

# Urgency encoding (unchanged)
# urgency_encoder = LabelEncoder()
# df_recipients['urgency_encoded'] = urgency_encoder.fit_transform(df_recipients['urgency'].str.lower())
# joblib.dump(urgency_encoder, 'urgency_encoder_finalee2.pkl')

df_recipients.to_csv('preprocessed_recipients_finalee2.csv', index=False)
df.to_csv('preprocessed_donations_with_shelf_finalee2.csv', index=False) # Ensure this is saved
print("✅ Preprocessing complete.")


# generate_labels.py
import pandas as pd
from geopy.distance import geodesic
import ast # Needed to convert string representations of lists back to lists

# Load preprocessed data
donations = pd.read_csv('preprocessed_donations_with_shelf_finalee2.csv')
recipients = pd.read_csv('preprocessed_recipients_finalee2.csv')

# Convert the 'food_type' column in recipients from string representation of lists to actual lists
# This is necessary because pandas reads lists from CSV as strings
recipients['food_type'] = recipients['food_type'].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else [])


matches = []

for idx_d, d in donations.iterrows():
    # Normalize donor food type for comparison
    donor_food_type_normalized = d['food_type'].strip().lower()

    for idx_r, r in recipients.iterrows():
        # --- CRITICAL CHANGE: food_match logic for multi-selection ---
        # Check if the donor's single food type is present in the recipient's LIST of food types
        food_match = donor_food_type_normalized in r['food_type']

        # quantity_match = d['surplus_quantity'] >= r['required_quantity']
         # --- NEW FEATURE 1: Binary for Exact Quantity Match ---
        # This will be 1 if donation quantity fully meets or exceeds required quantity, 0 otherwise.
        exact_quantity_match_feature = int(d['surplus_quantity'] >= r['required_quantity'])

        # --- NEW FEATURE 2: Continuous Quantity Ratio (capped at 1.0) ---
        # This will be 1.0 if donation quantity meets or exceeds required, otherwise the ratio.
        if r['required_quantity'] > 0:
            quantity_ratio_feature = min(1.0, d['surplus_quantity'] / r['required_quantity'])
        else:
            # If required_quantity is 0 (shouldn't happen with validation), decide what this means.
            # For simplicity, if required_quantity is 0 and surplus_quantity > 0, consider it 1.0.
            # If both are 0, it's 0.
            quantity_ratio_feature = 1.0 if d['surplus_quantity'] > 0 else 0.0

        distance = geodesic((d['lat'], d['lng']), (r['lat'], r['lng'])).km if not pd.isna(d['lat']) and not pd.isna(r['lat']) else float('inf')
        nearby = distance <= 50 # Example threshold, keep consistent

        # label = 1 if food_match and quantity_match and nearby else 0
        label = 1 if food_match and nearby and d['surplus_quantity'] > 0 else 0
        matches.append({
            'donor_id': d.name, # d.name is the DataFrame index, useful for linking back
            'recipient_id': r.name, # r.name is the DataFrame index
            'food_match': food_match, # This will be True/False
            'exact_quantity_match': exact_quantity_match_feature, # New feature
            'quantity_ratio': quantity_ratio_feature, 
            'distance': distance,
            'label': label
        })

pd.DataFrame(matches).to_csv('labeled_matches_finale2.csv', index=False)
print("✅ Label generation complete.")



# train_model.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pickle

labeled = pd.read_csv('labeled_matches_finale2.csv')
print("Unique values in 'label' column:", labeled['label'].unique())
print("Value counts for 'label' column:\n", labeled['label'].value_counts())
# X = labeled[['food_match', 'quantity_match', 'distance']]
# X = labeled[['food_match', 'quantity_match', 'distance']].copy()
X = labeled[['food_match', 'exact_quantity_match', 'quantity_ratio', 'distance']].copy()
y = labeled['label']

# X['food_match'] = X['food_match'].astype('int64')
# X['quantity_match'] = X['quantity_match'].astype('int64')
#  Optional: Ensure data types for existing columns if necessary
X['food_match'] = X['food_match'].astype('int64') # lready int, but harmless to ensure
X['exact_quantity_match'] = X['exact_quantity_match'].astype('int64') # Already int from generation
X['quantity_ratio'] = X['quantity_ratio'].astype('float64') # Already float from generation

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)



with open('match_model_finalee2.pkl', 'wb') as f:
    pickle.dump(model, f)
print("✅ Model trained and saved.")


# predict.py
import pandas as pd
import pickle

with open('match_model_finalee2.pkl', 'rb') as f:
    model = pickle.load(f)

# Example prediction input
# sample = pd.DataFrame([{
#     'food_match': 1,
#     'quantity_match': 1,
#     'distance': 12.5
# }])

# sample = pd.DataFrame([{
#     'food_match': 1,
#     'exact_quantity_match': 0,  # Example value: 0 if not an exact match
#     'quantity_ratio': 0.5,      # Example value: 0.5 for 50% fulfillment
#     'distance': 10.0
# }])

sample = pd.DataFrame([{
    'food_match': 1,
    'exact_quantity_match': 0,  # Example value: 0 if not an exact match
    'quantity_ratio': 0.5,      # Example value: 0.5 for 50% fulfillment
    'distance': 12.5
}])

prediction = model.predict(sample)
print("🔮 Prediction:", prediction[0])

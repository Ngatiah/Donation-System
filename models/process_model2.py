# preprocess_data.py
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from dateutil import parser
from datetime import datetime
import joblib

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

shelf_map = {
    'dry goods': 'shelf-stable',
    'produce': 'perishable',
    'breads & bakery': 'perishable',
    'dairy & eggs': 'refrigerated',
    'ready-to-drink beverages': 'shelf-stable',
    'fresh meat & seafood': 'refrigerated',
    'frozen': 'frozen',
    'prepared foods': 'refrigerated',
}
df['shelf_type'] = df['food_type'].map(shelf_map)

le_food = LabelEncoder()
df['food_type_encoded'] = le_food.fit_transform(df['food_type'])
df.to_csv('preprocessed_donations_with_shelf_finale.csv', index=False)
raw_cities = df['city'].dropna().astype(str).str.strip().str.title().unique()
# all_food_types = df['food_type'].dropna().astype(str).str.strip().str.title().unique()
# print(all_food_types)
all_cities_tocoords = df[['city', 'lat', 'lng']].dropna().drop_duplicates()
all_cities_tocoords['city'] = all_cities_tocoords['city'].astype(str).str.strip().str.title()
# all_coords_to_cities = all_cities_tocoords.sort_values(by='city')
all_coords_to_cities = all_cities_tocoords.sort_values(by='city').set_index('city')
all_cities = sorted(raw_cities)
joblib.dump(raw_cities, 'all_cities_finale.pkl')
joblib.dump(all_coords_to_cities, 'all_cities_tocoords_finale.pkl')
# city_to_check = "Nairobi"
# if city_to_check in all_coords_to_cities['city'].values:
#     print(f"{city_to_check} is present in all_coords_to_cities.")
# else:
#     print(f"{city_to_check} is NOT present in all_coords_to_cities.")

# print(all_coords_to_cities)


# === Simulate recipient data ===
recipient_data = [
    {'food_type': 'maize', 'city': 'Nairobi', 'urgency': 'high', 'required_quantity': 0.5},
    {'food_type': 'beans', 'city': 'Mombasa', 'urgency': 'medium', 'required_quantity': 0.3},
    {'food_type': 'rice', 'city': 'Kisumu', 'urgency': 'low', 'required_quantity': 1.0},
]
# food multiselection
# recipient_data = [
#     {'food_type': ['maize', 'rice'], 'city': 'Nairobi', 'urgency': 'high', 'required_quantity': 0.5},
#     {'food_type': ['beans'], 'city': 'Mombasa', 'urgency': 'medium', 'required_quantity': 0.3},
#     {'food_type': ['rice', 'dairy', 'maize'], 'city': 'Kisumu', 'urgency': 'low', 'required_quantity': 1.0},
#     {'food_type': [], 'city': 'Eldoret', 'urgency': 'low', 'required_quantity': 0.8},
# ]
df_recipients = pd.DataFrame(recipient_data)
df_recipients = df_recipients.merge(df[['city', 'lat', 'lng']], on='city', how='left')

# all_food_types = pd.concat([df['food_type'], df_recipients['food_type']])
# le_food.fit(all_food_types)
all_food_types = pd.concat([df['food_type'], df_recipients['food_type']]).dropna().astype(str).str.strip().str.lower().unique()
le_food.fit(all_food_types)
print("✅ Fitted food types:", le_food.classes_)
df_recipients['food_type_encoded'] = le_food.transform(df_recipients['food_type'])

urgency_encoder = LabelEncoder()
df_recipients['urgency_encoded'] = urgency_encoder.fit_transform(df_recipients['urgency'].str.lower())
joblib.dump(le_food, 'food_encoder_finale.pkl')
joblib.dump(urgency_encoder, 'urgency_encoder_finale.pkl')
df_recipients.to_csv('preprocessed_recipients_finale.csv', index=False)
print("✅ Preprocessing complete.")


# generate_labels.py
import pandas as pd
from geopy.distance import geodesic

# Load preprocessed data
donations = pd.read_csv('preprocessed_donations_with_shelf_finale.csv')
recipients = pd.read_csv('preprocessed_recipients_finale.csv')

matches = []

for _, d in donations.iterrows():
    for _, r in recipients.iterrows():
        food_match = d['food_type_encoded'] == r['food_type_encoded']
        quantity_match = d['surplus_quantity'] >= r['required_quantity']
        distance = geodesic((d['lat'], d['lng']), (r['lat'], r['lng'])).km if not pd.isna(d['lat']) and not pd.isna(r['lat']) else float('inf')
        nearby = distance <= 50
        label = 1 if food_match and quantity_match and nearby else 0
        matches.append({
            'donor_id': d.name,
            'recipient_id': r.name,
            'food_match': food_match,
            'quantity_match': quantity_match,
            'distance': distance,
            'label': label
        })

pd.DataFrame(matches).to_csv('labeled_matches_finale.csv', index=False)
print("✅ Label generation complete.")


# train_model.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pickle

labeled = pd.read_csv('labeled_matches_finale.csv')
# X = labeled[['food_match', 'quantity_match', 'distance']]
X = labeled[['food_match', 'quantity_match', 'distance']].copy()
y = labeled['label']

X['food_match'] = X['food_match'].astype('int64')
X['quantity_match'] = X['quantity_match'].astype('int64')


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

with open('match_model_finale.pkl', 'wb') as f:
    pickle.dump(model, f)
print("✅ Model trained and saved.")


# predict.py
import pandas as pd
import pickle

with open('match_model_finale.pkl', 'rb') as f:
    model = pickle.load(f)

# Example prediction input
sample = pd.DataFrame([{
    'food_match': 1,
    'quantity_match': 1,
    'distance': 12.5
}])

prediction = model.predict(sample)
print("🔮 Prediction:", prediction[0])

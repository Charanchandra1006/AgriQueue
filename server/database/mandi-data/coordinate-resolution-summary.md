# AgriQueue Mandi Coordinate Resolution Summary (Step 5C Dry Run)

**Execution Date:** 2026-09-02T09:56:38.910Z
**Mode:** Strictly Read-Only Audit (ZERO database writes)

## 1. Executive Metrics

| Metric | Count | Percentage |
| :--- | :---: | :---: |
| **Total Unmapped Mandis in Scope** | **215** | 100.0% |
| **Total Audited So Far** | **215** | 100.0% |
| **HIGH_CONFIDENCE Matches** | **4** | 1.9% |
| **UNRESOLVED_NULL Records** | **211** | 98.1% |
| **Ambiguous / Competing Candidate Cases** | **0** | 0.0% |

## 2. State-Wise Resolution Breakdown

| State | Audited | HIGH_CONFIDENCE | UNRESOLVED_NULL | Match Rate |
| :--- | :---: | :---: | :---: | :---: |
| Andhra Pradesh | 37 | 0 | 37 | 0.0% |
| Gujarat | 19 | 1 | 18 | 5.3% |
| Haryana | 14 | 0 | 14 | 0.0% |
| Himachal Pradesh | 3 | 0 | 3 | 0.0% |
| Karnataka | 25 | 2 | 23 | 8.0% |
| Madhya Pradesh | 13 | 0 | 13 | 0.0% |
| Maharashtra | 15 | 0 | 15 | 0.0% |
| Odisha | 19 | 0 | 19 | 0.0% |
| Punjab | 1 | 0 | 1 | 0.0% |
| Rajasthan | 20 | 0 | 20 | 0.0% |
| Tamil Nadu | 10 | 0 | 10 | 0.0% |
| Telangana | 21 | 1 | 20 | 4.8% |
| Uttar Pradesh | 18 | 0 | 18 | 0.0% |

## 3. Exact Validation Rules Enforced

1. **Rule 1 (Facility Classification):** Result must be classified as `amenity=marketplace`, `office=government`, or contain verified market terms (`mandi`, `apmc`, `market yard`, `grain market`, `anaj mandi`, `krishi upaj`, `rythu bazar`, `uzhavar sandhai`).
2. **Rule 2 (Anti-Centroid):** All generic place centroids (`place=city`, `town`, `village`, `suburb`, `hamlet`) and administrative boundaries (`boundary=administrative`) were strictly rejected.
3. **Rule 3 (Anti-Roadway):** Road segments and highway stretches (`class=highway`) were strictly rejected.
4. **Rule 4 (Administrative & Bounding Box Alignment):** Candidate state and district were cross-checked against target boundaries. Coordinates outside standard Indian mainland boundaries were rejected.
5. **Rule 5 (Ambiguity Suppression):** When competing candidates in divergent locations matched the market name, records were suppressed to `UNRESOLVED_NULL` to prevent misassignment.

## 4. Source & API Limitations Documented

- **OpenStreetMap Coverage:** Highly accurate for established district grain markets and urban APMCs; sparse for rural seasonal purchase centers.
- **Nominatim Rate Limits:** Throttled to 1 request per 1.1s to adhere to OpenStreetMap Foundation usage policy.
- **Resilience Protocol:** Incremental disk persistence with circuit-breaker for network outages.

## 5. List of HIGH_CONFIDENCE Matches (4 Records)

| ID | Mandi Name | District | State | Latitude | Longitude | Matched Name | OSM ID |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| 126 | Mehsana(Mehsana Veg) APMC | Mehsana | Gujarat | 23.596289 | 72.389984 | APMC mehsana | [4308249648](https://www.openstreetmap.org/node/4308249648) |
| 132 | Kalaburagi APMC | Kalaburagi | Karnataka | 17.350476 | 76.839285 | APMC Office | [4570124289](https://www.openstreetmap.org/node/4570124289) |
| 151 | Honnavar APMC | Uttara Kannada | Karnataka | 14.297932 | 74.452299 | APMC Yard Honnavar | [445287789](https://www.openstreetmap.org/way/445287789) |
| 217 | Warangal APMC | Warangal | Telangana | 17.995319 | 79.627566 | Warangal Agriculture Market Yard | [5409842949](https://www.openstreetmap.org/node/5409842949) |

## 6. List of UNRESOLVED_NULL Records (211 Records)

| ID | Mandi Name | District | State | Specific Reason for Rejection / Null |
| :---: | :--- | :--- | :--- | :--- |
| 197 | Araku Valley APMC | Alluri Sitharama Raju | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 210 | Payakaraopeta APMC | Anakapally | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 194 | Anantapur APMC | Ananthapuramu | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 207 | Gooti APMC | Ananthapuramu | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 195 | Urvakonda APMC | Ananthapuramu | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 189 | Bapatla APMC | Bapatla | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 182 | Parchur APMC | Bapatla | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 192 | Nagari APMC | Chittor | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 205 | Ravulapalem (Kothapeta APMC) | Dr.B.R.A.Konaseema | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 183 | Anaparthy APMC | East Godavari | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 204 | Gopalapuram APMC | East Godavari | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 199 | Rajanagaram APMC | East Godavari | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 177 | Kalidindi APMC | Eluru | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 208 | Polavaram APMC | Eluru | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 211 | Ungatur APMC | Eluru | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 193 | Yemmiganur APMC | Kurnool | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 181 | Koilkunta APMC | Nandyal | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 186 | Mylavaram APMC | NTR | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 179 | Nandigama APMC | NTR | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 212 | Tiruvuru APMC | NTR | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 203 | Ipur APMC | Palnadu | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 187 | Krosuru APMC | Palnadu | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 191 | Kandukur APMC | Prakasam | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 176 | Maddipadu APMC | Prakasam | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 190 | Udayagiri APMC | SPSR Nellore | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 201 | Dharmavaram APMC | Sri Sathya Sai | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 206 | Hindupur APMC | Sri Sathya Sai | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 198 | Etcherla APMC | Srikakulam | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 202 | Hiramandalam APMC | Srikakulam | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 196 | Palasa APMC | Srikakulam | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 188 | Pakala APMC | Tirupathi | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 180 | Puttur APMC | Tirupathi | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 178 | Railway Koduru APMC | Tirupathi | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 185 | Palakole APMC | West Godavari | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 184 | Penugonda APMC | West Godavari | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 209 | Proddatur APMC | YSR Kadapa | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 200 | Simhadhripuram APMC | YSR Kadapa | Andhra Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 118 | Anand(Veg,Yard,Anand) APMC | Anand | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 119 | Khambhat(Veg Yard Khambhat) APMC | Anand | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 112 | Bhabhar APMC | Banaskanth | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 127 | Deesa(Deesa Veg Yard) APMC | Banaskanth | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 116 | Palanpur APMC | Banaskanth | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 111 | Tharad APMC | Banaskanth | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 125 | Davgadbaria(Piplod) APMC | Dahod | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 110 | Devgadhbaria APMC | Dahod | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 122 | Zalod(Sanjeli) APMC | Dahod | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 121 | Mansa(Manas Veg Yard) APMC | Gandhinagar | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 109 | Navsari APMC | Navsari | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 115 | Morva Hafad APMC | Panchmahals | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 117 | Himatnagar(Veg.Market Himatnagar) APMC | Sabarkantha | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 123 | Modasa(Tintoi) APMC | Sabarkantha | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 114 | Vadali APMC | Sabarkantha | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 124 | Bardoli(Kadod) APMC | Surat | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 113 | Songadh APMC | Surat | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 120 | Chikli(Khorgam) APMC | Valsad | Gujarat | No candidate found in OpenStreetMap matching facility criteria. |
| 20 | Naraingarh APMC | Ambala | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 25 | Bhattu Kalan APMC | Fatehabad | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 26 | Jakhal APMC | Fatehabad | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 27 | Bahadurgarh APMC | Jhajar | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 21 | Narnaul APMC | Mahendragarh-Narnaul | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 18 | FerozpurZirkha(Nagina) APMC | Mewat | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 23 | Barwala APMC | Panchkula | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 24 | Raipur Rani APMC | Panchkula | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 15 | Madlauda APMC | Panipat | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 16 | Kosli APMC | Rewari | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 28 | Meham APMC | Rohtak | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 19 | Rohtak APMC | Rohtak | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 22 | Sonepat APMC | Sonipat | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 17 | Radaur APMC | Yamuna Nagar | Haryana | No candidate found in OpenStreetMap matching facility criteria. |
| 244 | PMY Bilaspur APMC | Bilaspur | Himachal Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 246 | PMY Kullu APMC | Kullu | Himachal Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 245 | PMY Paonta Sahib APMC | Sirmore | Himachal Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 129 | Hungund APMC | Bagalkot | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 134 | Ballari APMC | Bellary | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 147 | Channapatna APMC | Bengaluru South | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 144 | Basava Kalayana APMC | Bidar | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 131 | Chamarajanagar APMC | Chamarajanagar | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 133 | Chintamani APMC | Chikkaballapur | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 149 | Bantwala APMC | Dakshina Kannada | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 146 | Sulya APMC | Dakshina Kannada | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 148 | Channagiri APMC | Davangere | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 150 | Gadag APMC | Gadag | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 137 | Ranebennur APMC | Haveri | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 152 | Bangarpet APMC | Kolar | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 140 | Malur APMC | Kolar | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 136 | Gangavathi APMC | Koppal | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 139 | Hunsur APMC | Mysuru | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 141 | Mysuru APMC | Mysuru | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 138 | Raichur APMC | Raichur | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 135 | Sindhanur APMC | Raichur | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 145 | Siddapur APMC | Uttara Kannada | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 153 | Sirsi APMC | Uttara Kannada | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 130 | Yellapur APMC | Uttara Kannada | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 142 | Kottur APMC | Vijayanagara | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 143 | Talikot APMC | Vijayapura | Karnataka | No candidate found in OpenStreetMap matching facility criteria. |
| 92 | Bhind APMC | Bhind | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 93 | Lahar APMC | Bhind | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 84 | Loharda APMC | Dewas | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 81 | Harsood APMC | Khandwa | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 91 | Porsa APMC | Morena | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 85 | Jaora APMC | Ratlam | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 86 | Ratlam APMC | Ratlam | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 87 | Sailana APMC | Ratlam | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 88 | Badarwas APMC | Shivpuri | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 89 | Karera APMC | Shivpuri | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 90 | Pichhour APMC | Shivpuri | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 82 | Khachrod APMC | Ujjain | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 83 | Unhel APMC | Ujjain | Madhya Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 103 | Rahuri(Vambori) APMC | Ahilyanagar | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 104 | Telhara APMC | Akola | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 106 | Amarawati APMC | Amarawati | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 108 | Amrawati(Frui & Veg. Market) APMC | Amarawati | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 105 | Chandur Railway APMC | Amarawati | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 94 | Lonar APMC | Buldhana | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 102 | Agricultural Produce Market Committee Sillod | Chattrapati Sambhajinagar | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 107 | Chattrapati Sambhajinagar APMC | Chattrapati Sambhajinagar | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 101 | Vadgaonpeth APMC | Kolhapur | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 97 | Nagpur APMC | Nagpur | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 99 | Satana APMC | Nashik | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 96 | Sinner APMC | Nashik | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 100 | Sangli(Phale, Bhajipala Market) APMC | Sangli | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 95 | Vita APMC | Sangli | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 98 | Risod APMC | Washim | Maharashtra | No candidate found in OpenStreetMap matching facility criteria. |
| 170 | Talcher APMC | Angul | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 158 | Kantabaji APMC | Bolangir | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 167 | Boudh APMC | Boudh | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 168 | Dhenkanal APMC | Dhenkanal | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 162 | Kamakhyanagar APMC | Dhenkanal | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 165 | Parlakhemundi APMC | Gajapati | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 163 | Junagarh APMC | Kalahandi | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 174 | Kalahandi(Dharamagarh) APMC | Kalahandi | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 164 | Pattamundai APMC | Kendrapara | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 173 | Keonjhar APMC | Keonjhar | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 161 | Balugaon APMC | Khurda | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 172 | Betnoti APMC | Mayurbhanja | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 175 | Karanjia APMC | Mayurbhanja | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 171 | Udala APMC | Mayurbhanja | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 155 | Gunpur APMC | Rayagada | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 159 | Rayagada APMC | Rayagada | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 166 | Rairakhol APMC | Sambalpur | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 160 | Dungurapalli APMC | Sonepur | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 169 | Sargipali APMC | Sundergarh | Odisha | No candidate found in OpenStreetMap matching facility criteria. |
| 13 | Patran APMC | Patiala | Punjab | No candidate found in OpenStreetMap matching facility criteria. |
| 67 | Kawai Salpura - Atru APMC | Baran | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 61 | Jaitaran APMC | Beawar | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 63 | Begu APMC | Chittorgarh | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 58 | Sadulpur APMC | Churu | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 66 | Dausa APMC | Dausa | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 72 | Mandawari APMC | Dausa | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 69 | Kesarisinghpur APMC | Ganganagar | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 76 | Padampur APMC | Ganganagar | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 60 | Sadulshahar APMC | Ganganagar | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 59 | Bhadara APMC | Hanumangarh | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 62 | Jalore APMC | Jalore | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 64 | Bhawani Mandi APMC | Jhalawar | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 65 | Jodhpur (F&V) APMC | Jodhpur | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 74 | Osiyan Mathania APMC | Jodhpur | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 77 | Itawa APMC | Kota | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 75 | Ramganjmandi APMC | Kota | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 68 | Chhotisadri APMC | Pratapgarh | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 73 | Pratapgarh APMC | Pratapgarh | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 71 | Rajsamand APMC | Rajsamand | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 70 | Fatehnagar APMC | Udaipur | Rajasthan | No candidate found in OpenStreetMap matching facility criteria. |
| 239 | Palladam APMC | Coimbatore | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 240 | Udumalpet APMC | Coimbatore | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 238 | Vadavalli(Uzhavar Sandhai ) APMC | Coimbatore | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 236 | Dharmapuri(Uzhavar Sandhai ) APMC | Dharmapuri | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 237 | Palacode(Uzhavar Sandhai ) APMC | Dharmapuri | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 241 | Pennagaram(Uzhavar Sandhai ) APMC | Dharmapuri | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 242 | Chinnalapatti(Uzhavar Sandhai ) APMC | Dindigul | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 243 | Dindigul(Uzhavar Sandhai ) APMC | Dindigul | Tamil Nadu | Rejected: Result is a road or highway segment, not a market yard facility. |
| 235 | Perundurai(Uzhavar Sandhai ) APMC | Erode | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 234 | Tiruppur (South) (Uzhavar Sandhai ) APMC | Thirupur | Tamil Nadu | No candidate found in OpenStreetMap matching facility criteria. |
| 219 | Bhadrachalam APMC | Bhadradri Kothagudem | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 220 | Yellandu APMC | Bhadradri Kothagudem | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 231 | Excise Colony,RBZ APMC | Hanumakonda | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 225 | Bowenpally APMC | Hyderabad | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 230 | Alampur APMC | Jogulamba Gadwal | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 224 | V.Saidapur APMC | Karimnagar | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 218 | Khammam APMC | Khammam | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 221 | Kesamudram APMC | Mahabubabad | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 223 | Mahabubabad APMC | Mahabubabad | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 232 | Mahabubnagar(Rythu Bazar) APMC | Mahbubnagar | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 227 | Narsapur APMC | Medak | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 229 | Miryalguda(Rythu Bazar) APMC | Nalgonda | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 213 | Bhainsa APMC | Nirmal | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 226 | Chevella APMC | Ranga Reddy | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 222 | Saroornagar,RBZ APMC | Ranga Reddy | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 214 | Sadasivpet APMC | Sangareddy | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 233 | Vantamamidi APMC | Siddipet | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 215 | Suryapeta APMC | Suryapet | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 228 | Tirumalagiri APMC | Suryapet | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 216 | Tanduru APMC | Vikarabad | Telangana | No candidate found in OpenStreetMap matching facility criteria. |
| 43 | Khair APMC | Aligarh | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 51 | Akbarpur APMC | Ambedkarnagar | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 36 | Azamgarh APMC | Azamgarh | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 37 | Babrala APMC | Badaun | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 34 | Karvi APMC | Chitrakut | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 38 | Farukhabad APMC | Farukhabad | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 41 | Kayamganj APMC | Farukhabad | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 44 | Maudaha APMC | Hamirpur | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 48 | Shahabad(New Mandi) APMC | Hardoi | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 40 | Jhansi APMC | Jhansi | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 45 | Mauranipur APMC | Jhansi | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 42 | Kasganj APMC | Kasganj | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 39 | Golagokarnath APMC | Lakhimpur | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 46 | Mirzapur APMC | Mirzapur | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 52 | Rampurmaniharan APMC | Saharanpur | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 50 | Saharanpur APMC | Saharanpur | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 47 | Sambhal APMC | Sambhal | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |
| 49 | Shohratgarh APMC | Siddharth Nagar | Uttar Pradesh | No candidate found in OpenStreetMap matching facility criteria. |

## 7. Integrity Verification & Database Confirmation

- **MySQL mandis table modified?** NO. Zero write queries executed.
- **Existing 31 coordinates modified?** NO. All 31 existing records remain untouched.
- **Fake or guessed coordinates added?** NO. All unresolved records remain strictly `NULL`.

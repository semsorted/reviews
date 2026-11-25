export interface ShopType {
  label: string;
  group: string;
  chips: string[];
}

export const GENERIC_CHIPS = [
  "Service",
  "Staff behaviour",
  "Quality",
  "Price",
  "Value for money",
  "Cleanliness",
  "Waiting time",
  "Location",
  "Parking",
  "Overall experience",
];

const GROUPS: Record<string, Record<string, string[]>> = {
  "Food and drink": {
    Restaurant: ["Food taste", "Menu variety", "Service", "Staff behaviour", "Ambience", "Cleanliness", "Portion size", "Serving speed", "Value for money", "Parking"],
    "Cafe": ["Coffee", "Snacks", "Ambience", "Seating", "Service", "Staff behaviour", "Wi-Fi", "Music", "Cleanliness", "Value for money"],
    "Fine dining": ["Food presentation", "Food taste", "Ambience", "Service", "Staff courtesy", "Wine and drinks", "Menu selection", "Table setting", "Reservation process", "Value for money"],
    "Family restaurant": ["Food taste", "Kids menu", "Family seating", "Service", "Hygiene", "Portion size", "Menu variety", "Serving speed", "Value for money", "Parking"],
    "Dhaba": ["Food taste", "Tandoori items", "Portion size", "Serving speed", "Seating", "Cleanliness", "Parking", "Price", "Staff behaviour", "Highway access"],
    "Fast food": ["Food taste", "Order speed", "Freshness", "Portion size", "Combo offers", "Packaging", "Cleanliness", "Staff behaviour", "Price", "Value for money"],
    "Street food stall": ["Taste", "Freshness", "Hygiene", "Serving speed", "Portion size", "Price", "Variety", "Vendor behaviour", "Quality", "Value for money"],
    "Pizza shop": ["Pizza taste", "Crust", "Toppings", "Freshness", "Delivery time", "Packaging", "Offers", "Service", "Value for money", "Variety"],
    "Biryani house": ["Biryani taste", "Rice quality", "Spice level", "Portion size", "Side dishes", "Packaging", "Delivery time", "Value for money", "Service", "Freshness"],
    "South Indian restaurant": ["Dosa", "Idli", "Sambar and chutney", "Filter coffee", "Freshness", "Serving speed", "Cleanliness", "Price", "Service", "Staff behaviour"],
    "Bakery": ["Freshness", "Cakes", "Pastries", "Breads", "Taste", "Custom orders", "Packaging", "Variety", "Staff behaviour", "Price"],
    "Sweet shop": ["Sweets taste", "Freshness", "Variety", "Purity", "Snacks and namkeen", "Gift packing", "Hygiene", "Staff behaviour", "Price", "Packaging"],
    "Ice cream parlour": ["Flavours", "Taste", "Freshness", "Toppings", "Portion size", "Seating", "Cleanliness", "Service", "Price", "Variety"],
    "Juice bar": ["Freshness", "Taste", "Hygiene", "Fruit quality", "Menu variety", "Serving speed", "Portion size", "Price", "Cleanliness", "Staff behaviour"],
    "Tea stall": ["Tea taste", "Snacks", "Freshness", "Serving speed", "Hygiene", "Seating", "Price", "Staff behaviour", "Cleanliness", "Quality"],
    "Bar and lounge": ["Drinks", "Cocktails", "Food", "Music", "Ambience", "Bartender service", "Seating", "Crowd", "Value for money", "Hygiene"],
    "Cloud kitchen": ["Food taste", "Freshness", "Packaging", "Delivery time", "Portion size", "Order accuracy", "Menu variety", "Value for money", "Hygiene", "Price"],
    "Catering service": ["Food taste", "Menu options", "Presentation", "Staff service", "Timeliness", "Hygiene", "Quantity", "Value for money", "Coordination", "Price"],
  },
  Retail: {
    "Grocery store": ["Product range", "Freshness", "Price", "Stock availability", "Home delivery", "Billing speed", "Staff behaviour", "Cleanliness", "Offers", "Quality"],
    "Supermarket": ["Product range", "Price", "Offers", "Store layout", "Billing speed", "Freshness", "Cleanliness", "Staff help", "Parking", "Home delivery"],
    "Fruit and vegetable shop": ["Freshness", "Quality", "Variety", "Price", "Weighing accuracy", "Home delivery", "Cleanliness", "Shopkeeper behaviour", "Fruit quality", "Value for money"],
    "Meat and fish shop": ["Freshness", "Meat quality", "Cutting and cleaning", "Hygiene", "Weighing accuracy", "Variety", "Price", "Home delivery", "Quality", "Packaging"],
    "Dairy shop": ["Milk quality", "Paneer", "Curd and ghee", "Freshness", "Hygiene", "Home delivery", "Price", "Staff behaviour", "Quality", "Packaging"],
    "Clothing store": ["Collection", "Fabric quality", "Fitting", "Price", "Trial room", "Staff help", "Latest designs", "Exchange policy", "Store ambience", "Variety"],
    "Saree and ethnic wear": ["Saree collection", "Fabric quality", "Designs", "Bridal wear", "Price", "Staff guidance", "Alteration", "Store ambience", "Exchange policy", "Variety"],
    "Kids wear": ["Collection", "Fabric comfort", "Sizes", "Designs", "Price", "Staff help", "Exchange policy", "Store layout", "Quality", "Latest designs"],
    "Boutique": ["Designs", "Stitching", "Fitting", "Fabric quality", "Custom orders", "Delivery on time", "Price", "Designer guidance", "Finishing", "Communication"],
    "Tailor": ["Stitching quality", "Fitting", "Delivery on time", "Alteration", "Designs", "Price", "Tailor behaviour", "Measurement accuracy", "Finishing", "Communication"],
    "Footwear store": ["Collection", "Comfort", "Quality", "Size availability", "Brands", "Price", "Staff help", "Exchange policy", "Variety", "Durability"],
    "Jewellery store": ["Designs", "Purity", "Collection", "Making charges", "Transparency", "Staff guidance", "Billing", "Store ambience", "Exchange policy", "Custom orders"],
    "Watch and accessories": ["Collection", "Brands", "Authenticity", "Price", "Warranty", "Repair service", "Staff guidance", "Packaging", "Design", "Staff knowledge"],
    "Optical store": ["Frame collection", "Lens quality", "Eye testing", "Fitting", "Delivery time", "Price", "Staff guidance", "After-sales support", "Staff behaviour", "Value for money"],
    "Mobile shop": ["Product range", "Price", "Genuine products", "Exchange offers", "EMI options", "Staff guidance", "Warranty support", "Accessories", "Billing", "Staff behaviour"],
    "Mobile repair": ["Repair quality", "Turnaround time", "Genuine parts", "Price", "Warranty", "Technician behaviour", "Transparency", "Data safety", "Response time", "Communication"],
    "Electronics store": ["Product range", "Price", "Brands", "Product demo", "EMI options", "Delivery", "Installation", "Warranty support", "Staff knowledge", "Product quality"],
    "Computer and laptop shop": ["Product range", "Price", "Genuine products", "Technical guidance", "Repair service", "Warranty", "Upgrade options", "After-sales support", "Staff knowledge", "Delivery"],
    "Furniture store": ["Design", "Build quality", "Comfort", "Collection", "Price", "Delivery", "Installation", "Custom orders", "Staff guidance", "Material quality"],
    "Home decor": ["Collection", "Design", "Quality", "Price", "Staff guidance", "Delivery", "Packaging", "Custom orders", "Variety", "Latest designs"],
    "Hardware store": ["Product range", "Quality", "Stock availability", "Price", "Staff knowledge", "Billing speed", "Delivery", "Brands", "Staff behaviour", "Variety"],
    "Paint and building materials": ["Product range", "Quality", "Colour guidance", "Price", "Stock availability", "Delivery", "Staff knowledge", "Billing", "Brands", "Staff behaviour"],
    "Book and stationery": ["Book collection", "Stationery range", "School supplies", "Price", "Stock availability", "Staff help", "Store layout", "Billing speed", "Variety", "Value for money"],
    "Toy store": ["Toy collection", "Quality", "Safety", "Age-wise options", "Price", "Gift wrapping", "Staff help", "Store layout", "Variety", "Value for money"],
    "Gift shop": ["Collection", "Personalised gifts", "Gift wrapping", "Quality", "Price", "Delivery on time", "Staff help", "Custom orders", "Variety", "Packaging"],
    "Flower shop": ["Freshness", "Bouquet design", "Variety", "Delivery on time", "Custom arrangements", "Packaging", "Price", "Staff behaviour", "Flower quality", "Value for money"],
    "Cosmetics store": ["Product range", "Brands", "Genuine products", "Price", "Staff guidance", "Offers", "Store layout", "Billing", "Variety", "Staff knowledge"],
    "Sports store": ["Equipment range", "Brands", "Quality", "Price", "Staff knowledge", "Size availability", "Exchange policy", "Warranty", "Variety", "Staff help"],
    "Pet shop": ["Pet food range", "Accessories", "Product quality", "Pet care advice", "Price", "Cleanliness", "Staff behaviour", "Home delivery", "Pet handling", "Value for money"],
  },
  "Beauty and wellness": {
    "Salon": ["Haircut", "Hair colour", "Hair spa", "Styling", "Hygiene", "Staff skill", "Waiting time", "Ambience", "Price", "Products used"],
    "Barber shop": ["Haircut", "Beard styling", "Hygiene", "Waiting time", "Barber skill", "Price", "Ambience", "Staff behaviour", "Cleanliness", "Styling"],
    "Beauty parlour": ["Facial", "Threading", "Waxing", "Makeup", "Hygiene", "Products used", "Staff skill", "Ambience", "Price", "Waiting time"],
    "Bridal makeup studio": ["Makeup finish", "Hair styling", "Draping", "Products used", "Punctuality", "Artist skill", "Consultation", "Price", "Communication", "Value for money"],
    "Spa": ["Massage", "Therapist skill", "Ambience", "Hygiene", "Relaxation", "Privacy", "Products used", "Staff courtesy", "Price", "Cleanliness"],
    "Nail studio": ["Nail art", "Design options", "Hygiene", "Finish", "Durability", "Staff skill", "Ambience", "Price", "Cleanliness", "Creativity"],
    "Tattoo studio": ["Design", "Artist skill", "Hygiene", "Consultation", "Aftercare guidance", "Studio ambience", "Price", "Punctuality", "Cleanliness", "Communication"],
    "Gym": ["Equipment", "Trainers", "Cleanliness", "Workout space", "Timings", "Crowd", "Membership value", "Locker room", "Diet guidance", "Staff behaviour"],
    "Yoga studio": ["Instructor", "Class quality", "Studio ambience", "Timings", "Cleanliness", "Personal attention", "Batch size", "Fees", "Relaxation", "Staff behaviour"],
    "Dance academy": ["Instructors", "Dance styles", "Class quality", "Studio space", "Timings", "Personal attention", "Performances", "Fees", "Cleanliness", "Staff behaviour"],
  },
  Health: {
    "Hospital": ["Doctors", "Nursing care", "Cleanliness", "Facilities", "Waiting time", "Billing transparency", "Emergency care", "Staff behaviour", "Admission process", "Treatment"],
    "Clinic": ["Doctor consultation", "Treatment", "Waiting time", "Cleanliness", "Staff behaviour", "Appointment process", "Fees", "Follow-up care", "Explanation", "Hygiene"],
    "Dental clinic": ["Dentist", "Treatment", "Pain management", "Hygiene", "Equipment", "Explanation", "Waiting time", "Staff behaviour", "Fees", "Cleanliness"],
    "Eye clinic": ["Doctor consultation", "Eye testing", "Treatment", "Equipment", "Waiting time", "Staff behaviour", "Cleanliness", "Fees", "Explanation", "Hygiene"],
    "Skin and hair clinic": ["Doctor consultation", "Treatment results", "Hygiene", "Equipment", "Explanation", "Staff behaviour", "Follow-up care", "Fees", "Waiting time", "Cleanliness"],
    "Physiotherapy centre": ["Physiotherapist", "Treatment plan", "Recovery support", "Equipment", "Personal attention", "Cleanliness", "Timings", "Fees", "Explanation", "Staff behaviour"],
    "Ayurvedic centre": ["Doctor consultation", "Treatment", "Medicines", "Therapist care", "Hygiene", "Ambience", "Follow-up care", "Fees", "Explanation", "Waiting time"],
    "Pharmacy": ["Medicine availability", "Genuine products", "Pharmacist guidance", "Billing", "Discounts", "Home delivery", "Service speed", "Staff behaviour", "Price", "Cleanliness"],
    "Diagnostic lab": ["Sample collection", "Report accuracy", "Report timing", "Home collection", "Hygiene", "Staff behaviour", "Waiting time", "Price", "Cleanliness", "Billing"],
    "Veterinary clinic": ["Doctor care", "Treatment", "Pet handling", "Cleanliness", "Explanation", "Waiting time", "Staff behaviour", "Fees", "Hygiene", "Follow-up care"],
  },
  "Auto and transport": {
    "Car service centre": ["Service quality", "Turnaround time", "Genuine parts", "Billing transparency", "Advisor support", "Pickup and drop", "Cleanliness", "Price", "Staff behaviour", "Communication"],
    "Bike service centre": ["Service quality", "Turnaround time", "Genuine parts", "Mechanic skill", "Billing transparency", "Price", "Pickup and drop", "Staff behaviour", "Cleanliness", "Communication"],
    "Car wash and detailing": ["Cleaning quality", "Interior cleaning", "Polish finish", "Turnaround time", "Staff care", "Packages", "Waiting area", "Price", "Staff behaviour", "Value for money"],
    "Car showroom": ["Sales guidance", "Test drive", "Delivery process", "Finance options", "Transparency", "Showroom experience", "After-sales support", "Paperwork", "Staff behaviour", "Price"],
    "Bike showroom": ["Sales guidance", "Test ride", "Delivery process", "Finance options", "Transparency", "Paperwork", "After-sales support", "Accessories", "Staff behaviour", "Price"],
    "Tyre and battery shop": ["Product range", "Brands", "Fitting quality", "Wheel alignment", "Price", "Warranty", "Service speed", "Staff knowledge", "Staff behaviour", "Genuine products"],
    "Taxi and cab service": ["Driver behaviour", "Punctuality", "Vehicle cleanliness", "Safe driving", "Booking process", "Fare transparency", "Comfort", "Price", "Response time", "Customer support"],
    "Driving school": ["Instructor", "Teaching method", "Practice time", "Training vehicle", "Licence support", "Timings", "Safety focus", "Fees", "Staff behaviour", "Punctuality"],
  },
  Education: {
    "School": ["Teachers", "Academics", "Facilities", "Sports", "Safety", "Discipline", "Parent communication", "Activities", "Fees", "Communication"],
    "Coaching institute": ["Faculty", "Study material", "Doubt solving", "Test series", "Results", "Batch size", "Personal attention", "Fees", "Teaching method", "Staff behaviour"],
    "Tuition centre": ["Teachers", "Concept clarity", "Personal attention", "Homework support", "Regular tests", "Batch size", "Timings", "Fees", "Teaching method", "Results"],
    "Preschool and daycare": ["Teachers", "Child care", "Safety", "Cleanliness", "Activities", "Parent updates", "Play area", "Fees", "Staff behaviour", "Hygiene"],
    "Computer institute": ["Faculty", "Course content", "Practical training", "Lab facilities", "Placement support", "Certification", "Timings", "Fees", "Teaching method", "Personal attention"],
    "Language and spoken English": ["Trainer", "Speaking practice", "Course material", "Confidence building", "Batch size", "Timings", "Personal attention", "Fees", "Teaching method", "Results"],
    "Music academy": ["Teacher", "Teaching method", "Instruments", "Practice space", "Personal attention", "Performances", "Timings", "Fees", "Class quality", "Staff behaviour"],
  },
  "Home services": {
    "AC repair": ["Repair quality", "Technician skill", "Response time", "Punctuality", "Genuine parts", "Price", "Cleanliness after work", "Warranty", "Communication", "Transparency"],
    "Appliance repair": ["Repair quality", "Technician skill", "Response time", "Genuine parts", "Price", "Transparency", "Warranty", "Punctuality", "Cleanliness after work", "Communication"],
    "Plumber": ["Work quality", "Response time", "Punctuality", "Problem solving", "Price", "Cleanliness after work", "Behaviour", "Transparency", "Communication", "Timeliness"],
    "Electrician": ["Work quality", "Safety", "Response time", "Punctuality", "Problem solving", "Price", "Behaviour", "Transparency", "Communication", "Work speed"],
    "Carpenter": ["Workmanship", "Finishing", "Design input", "Material quality", "Delivery on time", "Price", "Behaviour", "Work speed", "Communication", "Transparency"],
    "Painter": ["Paint finish", "Colour guidance", "Work speed", "Cleanliness after work", "Material quality", "Price", "Team behaviour", "Finishing", "Communication", "Punctuality"],
    "Home cleaning": ["Cleaning quality", "Attention to detail", "Punctuality", "Team behaviour", "Products used", "Booking process", "Price", "Work speed", "Hygiene", "Communication"],
    "Pest control": ["Treatment results", "Safety", "Punctuality", "Technician behaviour", "Explanation", "Follow-up service", "Price", "Response time", "Communication", "Transparency"],
    "Laundry and dry cleaning": ["Cleaning quality", "Ironing", "Stain removal", "Delivery on time", "Garment care", "Pickup and drop", "Price", "Staff behaviour", "Packaging", "Turnaround time"],
    "Packers and movers": ["Packing quality", "Item safety", "Punctuality", "Team behaviour", "Transport", "Price transparency", "Coordination", "Unloading care", "Communication", "Timeliness"],
    "Interior designer": ["Design ideas", "Space planning", "Material quality", "Finishing", "Project timeline", "Communication", "Budget handling", "Site supervision", "Creativity", "Professionalism"],
  },
  "Professional services": {
    "CA and tax consultant": ["Expert advice", "GST support", "Tax filing", "Accuracy", "Timely work", "Communication", "Transparency", "Fees", "Professionalism", "Response time"],
    "Lawyer": ["Legal advice", "Case handling", "Communication", "Professionalism", "Transparency", "Timely updates", "Fees", "Expert advice", "Response time", "Explanation"],
    "Real estate agent": ["Property options", "Market knowledge", "Negotiation", "Transparency", "Paperwork support", "Communication", "Site visits", "Professionalism", "Response time", "Price transparency"],
    "Insurance agent": ["Policy guidance", "Claim support", "Transparency", "Communication", "Paperwork support", "Response time", "Professionalism", "Expert advice", "Explanation", "Follow-up service"],
    "Travel agency": ["Package options", "Itinerary planning", "Booking support", "Hotel selection", "Price", "Communication", "On-trip support", "Transparency", "Response time", "Value for money"],
    "Printing and flex shop": ["Print quality", "Design help", "Turnaround time", "Material quality", "Price", "Order accuracy", "Staff behaviour", "Delivery on time", "Design options", "Value for money"],
    "Courier service": ["Delivery speed", "Package safety", "Tracking", "Pickup service", "Price", "Staff behaviour", "Customer support", "Delivery time", "Response time", "Communication"],
    "Digital marketing agency": ["Strategy", "Results", "Creativity", "Communication", "Reporting", "Timely delivery", "Professionalism", "Value for money", "Expert advice", "Transparency"],
    "Coworking space": ["Workspace", "Internet speed", "Meeting rooms", "Community", "Cleanliness", "Support staff", "Location", "Pricing", "Seating", "Parking"],
  },
  "Events and stays": {
    "Hotel": ["Room comfort", "Cleanliness", "Front desk", "Food", "Staff behaviour", "Location", "Amenities", "Check-in process", "Value for money", "Wi-Fi"],
    "Resort": ["Rooms", "Food", "Pool and activities", "Views", "Staff service", "Cleanliness", "Amenities", "Family friendliness", "Value for money", "Location"],
    "Homestay": ["Host", "Room comfort", "Cleanliness", "Home food", "Location", "Amenities", "Check-in process", "Value for money", "Safety", "Comfort"],
    "PG and hostel": ["Rooms", "Food", "Cleanliness", "Safety", "Wi-Fi", "Warden and staff", "Location", "Rent value", "Privacy", "Value for money"],
    "Banquet and wedding hall": ["Venue", "Decoration", "Food", "Staff coordination", "Parking", "Seating", "Cleanliness", "Price", "Staff behaviour", "Value for money"],
    "Event planner": ["Planning", "Decoration", "Coordination", "Creativity", "Vendor management", "Punctuality", "Budget handling", "Communication", "Professionalism", "Value for money"],
    "Photographer": ["Photo quality", "Creativity", "Punctuality", "Editing", "Delivery time", "Professionalism", "Direction and posing", "Price", "Communication", "Behaviour"],
    "Decorator": ["Decoration design", "Flower quality", "Setup time", "Creativity", "Coordination", "Finishing", "Price", "Punctuality", "Communication", "Value for money"],
    "Cinema": ["Picture quality", "Sound", "Seating comfort", "Cleanliness", "Snacks", "Booking process", "Staff behaviour", "Price", "Location", "Parking"],
    "Gaming zone": ["Games", "Equipment", "Staff help", "Cleanliness", "Seating", "Timings", "Price", "Safety", "Value for money", "Music"],
  },
};

export const SHOP_TYPES: ShopType[] = Object.entries(GROUPS).flatMap(([group, types]) =>
  Object.entries(types).map(([label, chips]) => ({ label, group, chips }))
);

export const SHOP_TYPE_GROUPS = Object.keys(GROUPS);

export function isCatalogShopType(label: string): boolean {
  return SHOP_TYPES.some((type) => type.label === label);
}

export function chipsForShopType(label: string): string[] {
  return SHOP_TYPES.find((type) => type.label === label)?.chips ?? GENERIC_CHIPS;
}

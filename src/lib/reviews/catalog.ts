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
    Restaurant: ["Food taste", "Food quality", "Menu variety", "Service", "Staff behaviour", "Ambience", "Cleanliness", "Portion size", "Serving speed", "Value for money", "Seating", "Parking"],
    "Cafe": ["Coffee", "Snacks", "Ambience", "Seating", "Service", "Staff behaviour", "Wi-Fi", "Music", "Cleanliness", "Menu variety", "Value for money"],
    "Fine dining": ["Food presentation", "Food taste", "Ambience", "Service", "Staff courtesy", "Wine and drinks", "Menu selection", "Table setting", "Reservation process", "Value for money"],
    "Family restaurant": ["Food taste", "Kids menu", "Family seating", "Service", "Hygiene", "Portion size", "Menu variety", "Serving speed", "Value for money", "Parking"],
    "Dhaba": ["Food taste", "Tandoori items", "Portion size", "Serving speed", "Seating", "Cleanliness", "Parking", "Price", "Staff behaviour", "Highway access"],
    "Fast food": ["Food taste", "Order speed", "Freshness", "Portion size", "Combo offers", "Packaging", "Cleanliness", "Staff behaviour", "Price"],
    "Street food stall": ["Taste", "Freshness", "Hygiene", "Serving speed", "Portion size", "Price", "Variety", "Vendor behaviour"],
    "Pizza shop": ["Pizza taste", "Crust", "Toppings", "Freshness", "Delivery time", "Packaging", "Offers", "Service", "Value for money"],
    "Biryani house": ["Biryani taste", "Rice quality", "Spice level", "Portion size", "Side dishes", "Packaging", "Delivery time", "Value for money", "Service"],
    "South Indian restaurant": ["Dosa", "Idli", "Sambar and chutney", "Filter coffee", "Freshness", "Serving speed", "Cleanliness", "Price", "Service"],
    "Bakery": ["Freshness", "Cakes", "Pastries", "Breads", "Taste", "Custom orders", "Packaging", "Variety", "Staff behaviour", "Price"],
    "Sweet shop": ["Sweets taste", "Freshness", "Variety", "Purity", "Snacks and namkeen", "Gift packing", "Hygiene", "Staff behaviour", "Price"],
    "Ice cream parlour": ["Flavours", "Taste", "Freshness", "Toppings", "Portion size", "Seating", "Cleanliness", "Service", "Price"],
    "Juice bar": ["Freshness", "Taste", "Hygiene", "Fruit quality", "Menu variety", "Serving speed", "Portion size", "Price"],
    "Tea stall": ["Tea taste", "Snacks", "Freshness", "Serving speed", "Hygiene", "Seating", "Price", "Staff behaviour"],
    "Bar and lounge": ["Drinks", "Cocktails", "Food", "Music", "Ambience", "Bartender service", "Seating", "Crowd", "Value for money", "Hygiene"],
    "Cloud kitchen": ["Food taste", "Freshness", "Packaging", "Delivery time", "Portion size", "Order accuracy", "Menu variety", "Value for money"],
    "Catering service": ["Food taste", "Menu options", "Presentation", "Staff service", "Timeliness", "Hygiene", "Quantity", "Value for money", "Coordination"],
  },
  Retail: {
    "Grocery store": ["Product range", "Freshness", "Price", "Stock availability", "Home delivery", "Billing speed", "Staff behaviour", "Cleanliness", "Offers"],
    "Supermarket": ["Product range", "Price", "Offers", "Store layout", "Billing speed", "Freshness", "Cleanliness", "Staff help", "Parking", "Home delivery"],
    "Fruit and vegetable shop": ["Freshness", "Quality", "Variety", "Price", "Weighing accuracy", "Home delivery", "Cleanliness", "Shopkeeper behaviour"],
    "Meat and fish shop": ["Freshness", "Meat quality", "Cutting and cleaning", "Hygiene", "Weighing accuracy", "Variety", "Price", "Home delivery"],
    "Dairy shop": ["Milk quality", "Paneer", "Curd and ghee", "Freshness", "Hygiene", "Home delivery", "Price", "Staff behaviour"],
    "Clothing store": ["Collection", "Fabric quality", "Fitting", "Price", "Trial room", "Staff help", "Latest designs", "Exchange policy", "Store ambience"],
    "Saree and ethnic wear": ["Saree collection", "Fabric quality", "Designs", "Bridal wear", "Price", "Staff guidance", "Alteration", "Store ambience", "Exchange policy"],
    "Kids wear": ["Collection", "Fabric comfort", "Sizes", "Designs", "Price", "Staff help", "Exchange policy", "Store layout"],
    "Boutique": ["Designs", "Stitching", "Fitting", "Fabric quality", "Custom orders", "Delivery on time", "Price", "Designer guidance"],
    "Tailor": ["Stitching quality", "Fitting", "Delivery on time", "Alteration", "Designs", "Price", "Tailor behaviour", "Measurement accuracy"],
    "Footwear store": ["Collection", "Comfort", "Quality", "Size availability", "Brands", "Price", "Staff help", "Exchange policy"],
    "Jewellery store": ["Designs", "Purity", "Collection", "Making charges", "Transparency", "Staff guidance", "Billing", "Store ambience", "Exchange policy", "Custom orders"],
    "Watch and accessories": ["Collection", "Brands", "Authenticity", "Price", "Warranty", "Repair service", "Staff guidance", "Packaging"],
    "Optical store": ["Frame collection", "Lens quality", "Eye testing", "Fitting", "Delivery time", "Price", "Staff guidance", "After-sales support"],
    "Mobile shop": ["Product range", "Price", "Genuine products", "Exchange offers", "EMI options", "Staff guidance", "Warranty support", "Accessories", "Billing"],
    "Mobile repair": ["Repair quality", "Turnaround time", "Genuine parts", "Price", "Warranty", "Technician behaviour", "Transparency", "Data safety"],
    "Electronics store": ["Product range", "Price", "Brands", "Product demo", "EMI options", "Delivery", "Installation", "Warranty support", "Staff knowledge"],
    "Computer and laptop shop": ["Product range", "Price", "Genuine products", "Technical guidance", "Repair service", "Warranty", "Upgrade options", "After-sales support"],
    "Furniture store": ["Design", "Build quality", "Comfort", "Collection", "Price", "Delivery", "Installation", "Custom orders", "Staff guidance"],
    "Home decor": ["Collection", "Design", "Quality", "Price", "Staff guidance", "Delivery", "Packaging", "Custom orders"],
    "Hardware store": ["Product range", "Quality", "Stock availability", "Price", "Staff knowledge", "Billing speed", "Delivery", "Brands"],
    "Paint and building materials": ["Product range", "Quality", "Colour guidance", "Price", "Stock availability", "Delivery", "Staff knowledge", "Billing"],
    "Book and stationery": ["Book collection", "Stationery range", "School supplies", "Price", "Stock availability", "Staff help", "Store layout", "Billing speed"],
    "Toy store": ["Toy collection", "Quality", "Safety", "Age-wise options", "Price", "Gift wrapping", "Staff help", "Store layout"],
    "Gift shop": ["Collection", "Personalised gifts", "Gift wrapping", "Quality", "Price", "Delivery on time", "Staff help", "Custom orders"],
    "Flower shop": ["Freshness", "Bouquet design", "Variety", "Delivery on time", "Custom arrangements", "Packaging", "Price", "Staff behaviour"],
    "Cosmetics store": ["Product range", "Brands", "Genuine products", "Price", "Staff guidance", "Offers", "Store layout", "Billing"],
    "Sports store": ["Equipment range", "Brands", "Quality", "Price", "Staff knowledge", "Size availability", "Exchange policy", "Warranty"],
    "Pet shop": ["Pet food range", "Accessories", "Product quality", "Pet care advice", "Price", "Cleanliness", "Staff behaviour", "Home delivery"],
  },
  "Beauty and wellness": {
    "Salon": ["Haircut", "Hair colour", "Hair spa", "Styling", "Hygiene", "Staff skill", "Waiting time", "Ambience", "Price", "Products used"],
    "Barber shop": ["Haircut", "Beard styling", "Hygiene", "Waiting time", "Barber skill", "Price", "Ambience", "Staff behaviour"],
    "Beauty parlour": ["Facial", "Threading", "Waxing", "Makeup", "Hygiene", "Products used", "Staff skill", "Ambience", "Price", "Waiting time"],
    "Bridal makeup studio": ["Makeup finish", "Hair styling", "Draping", "Products used", "Punctuality", "Artist skill", "Consultation", "Price"],
    "Spa": ["Massage", "Therapist skill", "Ambience", "Hygiene", "Relaxation", "Privacy", "Products used", "Staff courtesy", "Price"],
    "Nail studio": ["Nail art", "Design options", "Hygiene", "Finish", "Durability", "Staff skill", "Ambience", "Price"],
    "Tattoo studio": ["Design", "Artist skill", "Hygiene", "Consultation", "Aftercare guidance", "Studio ambience", "Price", "Punctuality"],
    "Gym": ["Equipment", "Trainers", "Cleanliness", "Workout space", "Timings", "Crowd", "Membership value", "Locker room", "Diet guidance"],
    "Yoga studio": ["Instructor", "Class quality", "Studio ambience", "Timings", "Cleanliness", "Personal attention", "Batch size", "Fees"],
    "Dance academy": ["Instructors", "Dance styles", "Class quality", "Studio space", "Timings", "Personal attention", "Performances", "Fees"],
  },
  Health: {
    "Hospital": ["Doctors", "Nursing care", "Cleanliness", "Facilities", "Waiting time", "Billing transparency", "Emergency care", "Staff behaviour", "Admission process"],
    "Clinic": ["Doctor consultation", "Treatment", "Waiting time", "Cleanliness", "Staff behaviour", "Appointment process", "Fees", "Follow-up care"],
    "Dental clinic": ["Dentist", "Treatment", "Pain management", "Hygiene", "Equipment", "Explanation", "Waiting time", "Staff behaviour", "Fees"],
    "Eye clinic": ["Doctor consultation", "Eye testing", "Treatment", "Equipment", "Waiting time", "Staff behaviour", "Cleanliness", "Fees"],
    "Skin and hair clinic": ["Doctor consultation", "Treatment results", "Hygiene", "Equipment", "Explanation", "Staff behaviour", "Follow-up care", "Fees"],
    "Physiotherapy centre": ["Physiotherapist", "Treatment plan", "Recovery support", "Equipment", "Personal attention", "Cleanliness", "Timings", "Fees"],
    "Ayurvedic centre": ["Doctor consultation", "Treatment", "Medicines", "Therapist care", "Hygiene", "Ambience", "Follow-up care", "Fees"],
    "Pharmacy": ["Medicine availability", "Genuine products", "Pharmacist guidance", "Billing", "Discounts", "Home delivery", "Service speed", "Staff behaviour"],
    "Diagnostic lab": ["Sample collection", "Report accuracy", "Report timing", "Home collection", "Hygiene", "Staff behaviour", "Waiting time", "Price"],
    "Veterinary clinic": ["Doctor care", "Treatment", "Pet handling", "Cleanliness", "Explanation", "Waiting time", "Staff behaviour", "Fees"],
  },
  "Auto and transport": {
    "Car service centre": ["Service quality", "Turnaround time", "Genuine parts", "Billing transparency", "Advisor support", "Pickup and drop", "Cleanliness", "Price"],
    "Bike service centre": ["Service quality", "Turnaround time", "Genuine parts", "Mechanic skill", "Billing transparency", "Price", "Pickup and drop", "Staff behaviour"],
    "Car wash and detailing": ["Cleaning quality", "Interior cleaning", "Polish finish", "Turnaround time", "Staff care", "Packages", "Waiting area", "Price"],
    "Car showroom": ["Sales guidance", "Test drive", "Delivery process", "Finance options", "Transparency", "Showroom experience", "After-sales support", "Paperwork"],
    "Bike showroom": ["Sales guidance", "Test ride", "Delivery process", "Finance options", "Transparency", "Paperwork", "After-sales support", "Accessories"],
    "Tyre and battery shop": ["Product range", "Brands", "Fitting quality", "Wheel alignment", "Price", "Warranty", "Service speed", "Staff knowledge"],
    "Taxi and cab service": ["Driver behaviour", "Punctuality", "Vehicle cleanliness", "Safe driving", "Booking process", "Fare transparency", "Comfort"],
    "Driving school": ["Instructor", "Teaching method", "Practice time", "Training vehicle", "Licence support", "Timings", "Safety focus", "Fees"],
  },
  Education: {
    "School": ["Teachers", "Academics", "Facilities", "Sports", "Safety", "Discipline", "Parent communication", "Activities", "Fees"],
    "Coaching institute": ["Faculty", "Study material", "Doubt solving", "Test series", "Results", "Batch size", "Personal attention", "Fees"],
    "Tuition centre": ["Teachers", "Concept clarity", "Personal attention", "Homework support", "Regular tests", "Batch size", "Timings", "Fees"],
    "Preschool and daycare": ["Teachers", "Child care", "Safety", "Cleanliness", "Activities", "Parent updates", "Play area", "Fees"],
    "Computer institute": ["Faculty", "Course content", "Practical training", "Lab facilities", "Placement support", "Certification", "Timings", "Fees"],
    "Language and spoken English": ["Trainer", "Speaking practice", "Course material", "Confidence building", "Batch size", "Timings", "Personal attention", "Fees"],
    "Music academy": ["Teacher", "Teaching method", "Instruments", "Practice space", "Personal attention", "Performances", "Timings", "Fees"],
  },
  "Home services": {
    "AC repair": ["Repair quality", "Technician skill", "Response time", "Punctuality", "Genuine parts", "Price", "Cleanliness after work", "Warranty"],
    "Appliance repair": ["Repair quality", "Technician skill", "Response time", "Genuine parts", "Price", "Transparency", "Warranty", "Punctuality"],
    "Plumber": ["Work quality", "Response time", "Punctuality", "Problem solving", "Price", "Cleanliness after work", "Behaviour"],
    "Electrician": ["Work quality", "Safety", "Response time", "Punctuality", "Problem solving", "Price", "Behaviour"],
    "Carpenter": ["Workmanship", "Finishing", "Design input", "Material quality", "Delivery on time", "Price", "Behaviour"],
    "Painter": ["Paint finish", "Colour guidance", "Work speed", "Cleanliness after work", "Material quality", "Price", "Team behaviour"],
    "Home cleaning": ["Cleaning quality", "Attention to detail", "Punctuality", "Team behaviour", "Products used", "Booking process", "Price"],
    "Pest control": ["Treatment results", "Safety", "Punctuality", "Technician behaviour", "Explanation", "Follow-up service", "Price"],
    "Laundry and dry cleaning": ["Cleaning quality", "Ironing", "Stain removal", "Delivery on time", "Garment care", "Pickup and drop", "Price", "Staff behaviour"],
    "Packers and movers": ["Packing quality", "Item safety", "Punctuality", "Team behaviour", "Transport", "Price transparency", "Coordination", "Unloading care"],
    "Interior designer": ["Design ideas", "Space planning", "Material quality", "Finishing", "Project timeline", "Communication", "Budget handling", "Site supervision"],
  },
  "Professional services": {
    "CA and tax consultant": ["Expert advice", "GST support", "Tax filing", "Accuracy", "Timely work", "Communication", "Transparency", "Fees"],
    "Lawyer": ["Legal advice", "Case handling", "Communication", "Professionalism", "Transparency", "Timely updates", "Fees"],
    "Real estate agent": ["Property options", "Market knowledge", "Negotiation", "Transparency", "Paperwork support", "Communication", "Site visits", "Professionalism"],
    "Insurance agent": ["Policy guidance", "Claim support", "Transparency", "Communication", "Paperwork support", "Response time", "Professionalism"],
    "Travel agency": ["Package options", "Itinerary planning", "Booking support", "Hotel selection", "Price", "Communication", "On-trip support", "Transparency"],
    "Printing and flex shop": ["Print quality", "Design help", "Turnaround time", "Material quality", "Price", "Order accuracy", "Staff behaviour"],
    "Courier service": ["Delivery speed", "Package safety", "Tracking", "Pickup service", "Price", "Staff behaviour", "Customer support"],
    "Digital marketing agency": ["Strategy", "Results", "Creativity", "Communication", "Reporting", "Timely delivery", "Professionalism", "Value for money"],
    "Coworking space": ["Workspace", "Internet speed", "Meeting rooms", "Community", "Cleanliness", "Support staff", "Location", "Pricing"],
  },
  "Events and stays": {
    "Hotel": ["Room comfort", "Cleanliness", "Front desk", "Food", "Staff behaviour", "Location", "Amenities", "Check-in process", "Value for money", "Wi-Fi"],
    "Resort": ["Rooms", "Food", "Pool and activities", "Views", "Staff service", "Cleanliness", "Amenities", "Family friendliness", "Value for money"],
    "Homestay": ["Host", "Room comfort", "Cleanliness", "Home food", "Location", "Amenities", "Check-in process", "Value for money"],
    "PG and hostel": ["Rooms", "Food", "Cleanliness", "Safety", "Wi-Fi", "Warden and staff", "Location", "Rent value"],
    "Banquet and wedding hall": ["Venue", "Decoration", "Food", "Staff coordination", "Parking", "Seating", "Cleanliness", "Price"],
    "Event planner": ["Planning", "Decoration", "Coordination", "Creativity", "Vendor management", "Punctuality", "Budget handling", "Communication"],
    "Photographer": ["Photo quality", "Creativity", "Punctuality", "Editing", "Delivery time", "Professionalism", "Direction and posing", "Price"],
    "Decorator": ["Decoration design", "Flower quality", "Setup time", "Creativity", "Coordination", "Finishing", "Price"],
    "Cinema": ["Picture quality", "Sound", "Seating comfort", "Cleanliness", "Snacks", "Booking process", "Staff behaviour", "Price"],
    "Gaming zone": ["Games", "Equipment", "Staff help", "Cleanliness", "Seating", "Timings", "Price", "Safety"],
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

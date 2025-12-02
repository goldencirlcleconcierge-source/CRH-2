import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  Search,
  MapPin,
  Home,
  User as UserIcon,
  PawPrint,
  Heart,
  Star,
  Phone,
  Sparkles,
  Zap,
  Clock,
  Map as MapIcon,
  X,
  Users,
  TrendingUp,
  Briefcase,
  Layers,
  Clipboard,
  Info,
  ExternalLink,
  Loader,
  Globe,
  Plus,
  Shield, 
  GitBranch,
  Flag,
  Ruler,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Copy,
  Mail,
  Navigation,
  MessageSquare,
  Send,
  LogOut,
  Download,
  Check,
  Filter
} from 'lucide-react';

// --- TYPE DEFINITIONS ---

// IMPORTANT: Google Client ID provided by user
const GOOGLE_CLIENT_ID = "458835803594-8nirbuicm0974n5r6gg126csrvgm6av3.apps.googleusercontent.com";

declare global {
    interface Window {
        google: any;
    }
}

type Category = 
  | 'food-security' 
  | 'housing-stability' 
  | 'mental-health' 
  | 'employment-services' 
  | 'utility-assistance' 
  | 'legal-aid' 
  | 'domestic-violence' 
  | 'youth-services' 
  | 'veteran-support' 
  | 'family-support' 
  | 'disability-services' 
  | 'senior-services' 
  | 'pet-assistance' 
  | 'healthcare' 
  | 'financial-services' 
  | 'education-training' 
  | 'community-resources';

type Status = 'active' | 'seasonal' | 'closed';

interface Location {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

interface Contact {
  phone: string | null;
  email: string | null;
  website: string | null;
}

interface TrustMetrics {
  verificationStatus: 'verified' | 'pending' | 'unverified';
  verificationSources: string[];
  lastVerified: string;
  verificationScore: number;
  reportCount: number;
}

interface Resource {
  id: string;
  name: string;
  description: string;
  category: Category;
  status: Status;
  location: Location;
  contact: Contact;
  services: string[];
  eligibility: string[];
  hours: string;
  trust: TrustMetrics;
}

interface Review {
  id: string;
  resourceId: string;
  author: string;
  authorRole: string;
  authorPicture?: string;
  rating: number; // 1-10
  tags: string[];
  comment: string;
  date: string;
  verified: boolean;
}

interface User {
  name: string;
  email: string;
  picture: string;
  role: string;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

// --- CONSTANTS ---

const ROLES = [
    "CHW",
    "Certified CHW", 
    "Health Navigator",
    "Administrative Coordinator",
    "Clinical Staff",
    "Social Worker",
    "Other"
];

const POSITIVE_TAGS = ["Fast Response", "Easy Application", "Multilingual Staff", "Welcoming Environment", "Accessible", "High Quality Care", "Cultural Competence", "Reliable"];
const NEGATIVE_TAGS = ["Long Waitlist", "Complex Forms", "Phone Unanswered", "Limited Hours", "Language Barrier", "Strict Eligibility", "Unwelcoming", "Outdated Info"];

const CATEGORY_MAP: Record<string, Category> = {
    'food': 'food-security',
    'housing': 'housing-stability',
    'utility': 'utility-assistance',
    'util': 'utility-assistance',
    'mental-health': 'mental-health',
    'mh': 'mental-health',
    'employment': 'employment-services',
    'emp': 'employment-services',
    'legal': 'legal-aid',
    'domestic-violence': 'domestic-violence',
    'dv': 'domestic-violence',
    'youth': 'youth-services',
    'veterans': 'veteran-support',
    'vet': 'veteran-support',
    'family': 'family-support',
    'dcf': 'family-support',
    'disability': 'disability-services',
    'dis': 'disability-services',
    'senior': 'senior-services',
    'pet': 'pet-assistance',
    'healthcare': 'healthcare',
    'health': 'healthcare',
    'med': 'healthcare',
    'financial': 'financial-services',
    'financial-services': 'financial-services',
    'fin': 'financial-services',
    'education': 'education-training',
    'edu': 'education-training',
    'community': 'community-resources',
    'comm': 'community-resources',
    'dept': 'community-resources',
    'res': 'community-resources',
};

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
    'food-security': PawPrint,
    'housing-stability': Home,
    'mental-health': Heart,
    'employment-services': Briefcase,
    'utility-assistance': Layers,
    'legal-aid': Clipboard,
    'domestic-violence': Shield,
    'youth-services': UserIcon,
    'veteran-support': Flag,
    'family-support': Users,
    'disability-services': Ruler,
    'senior-services': Clock,
    'pet-assistance': PawPrint,
    'healthcare': Plus,
    'financial-services': Zap,
    'education-training': TrendingUp,
    'community-resources': GitBranch,
};

const CATEGORY_COLORS: Record<Category, string> = {
    'food-security': 'text-amber-600 bg-amber-50 border-amber-200',
    'housing-stability': 'text-teal-600 bg-teal-50 border-teal-200',
    'mental-health': 'text-rose-600 bg-rose-50 border-rose-200',
    'employment-services': 'text-indigo-600 bg-indigo-50 border-indigo-200',
    'utility-assistance': 'text-cyan-600 bg-cyan-50 border-cyan-200',
    'legal-aid': 'text-orange-600 bg-orange-50 border-orange-200',
    'domestic-violence': 'text-red-700 bg-red-50 border-red-200',
    'youth-services': 'text-purple-600 bg-purple-50 border-purple-200',
    'veteran-support': 'text-green-700 bg-green-50 border-green-200',
    'family-support': 'text-pink-600 bg-pink-50 border-pink-200',
    'disability-services': 'text-slate-600 bg-slate-100 border-slate-300',
    'senior-services': 'text-yellow-700 bg-yellow-50 border-yellow-200',
    'pet-assistance': 'text-lime-700 bg-lime-50 border-lime-200',
    'healthcare': 'text-sky-600 bg-sky-50 border-sky-200',
    'financial-services': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'education-training': 'text-indigo-700 bg-indigo-50 border-indigo-200',
    'community-resources': 'text-gray-600 bg-gray-50 border-gray-200',
};

// --- DATA PARSING ---

const RAW_RESOURCE_DATA = `ID,Name,Category,City,Address,Phone,Website,Status,Services,Eligibility,Description
housing-metro,Metro Housing|Boston,housing,Boston,1411 Tremont St,617-425-6700,https://www.metrohousingboston.org,active,"RAFT (Rental Assistance);Section 8;Eviction Prevention;Housing Search","Greater Boston residents;Income eligible","Application intake for RAFT and ERMA (Emergency Rental Assistance). Provides rental assistance, housing search, and eviction prevention services."
housing-pine,Pine Street Inn,housing,Boston,444 Harrison Ave,617-892-9100,https://www.pinestreetinn.org,active,"Emergency Shelter (Men's & Women's);Permanent Housing;Job Training","Homeless individuals 18+","New England’s leading organization dedicated to ending homelessness through permanent housing, emergency shelter, and job training."
housing-rosie,Rosie's Place,housing,Boston,889 Harrison Ave,617-442-9322,https://www.rosiesplace.org,active,"Emergency Shelter;Meals;Advocacy;Education","Women only","The first women’s shelter in the United States, offering emergency services and long-term support."
housing-clvu,City Life/Vida Urbana,housing,Jamaica Plain,284 Amory St,617-524-3541,http://www.clvu.org,active,"Tenant Organizing;Eviction Defense;Rights Education","Tenants;Low-income","A grassroots community organization committed to fighting for racial, social and economic justice and gender equality by building working class power."
food-projectbread,Project Bread FoodSource Hotline,food,Boston,145 Border St,1-800-645-8333,https://www.projectbread.org,active,"SNAP Application Assistance;Food Resource Referral","All MA Residents","Statewide helpline for SNAP (Food Stamp) pre-screening, application assistance, and finding local food resources."
food-gbfb,The Greater Boston Food Bank (GBFB),food,Boston,70 South Bay Ave,617-427-5200,https://www.gbfb.org,active,"Agency Partner Locator;Food Distribution","Varies by partner agency","CHWs use the GBFB locator to find the closest of hundreds of pantries, soup kitchens, and meal sites in the Boston area."
utility-abcd,ABCD Fuel Assistance (LIHEAP),utility,Boston,178 Tremont St,617-357-6012,https://bostonabcd.org/service/fuel-assistance-2/,active,"Heating Bill Help;Weatherization;Utility Assistance","Income eligible households","Anti-poverty services including Head Start, job training, and local intake for LIHEAP to help with heating bills."
mh-bhhl,MA Behavioral Health Help Line,mental-health,Boston,Virtual/Statewide,1-833-773-2445,https://www.masshelpline.com,active,"Crisis Support;Mental Health Referrals;Substance Use Referrals","All MA Residents","24/7/365 single point of entry for all urgent and routine mental health/SUD services. Call or text."
health-bhchp,Boston Health Care for the Homeless,healthcare,Boston,780 Albany St,857-654-1000,https://www.bhchp.org,active,"Medical Care;Dental;Behavioral Health;Street Outreach","Individuals experiencing homelessness","Ensuring unconditional, high-quality health care for all, regardless of ability to pay."
comm-211,Mass 211,community,Boston,Statewide Service,2-1-1,https://mass211.org,active,"Shelter Referral;Utility Assistance (LIHEAP);RAFT Referral","All MA Residents","Initial, 24/7 centralized entry point for shelter, utility (LIHEAP), and RAFT (rental assistance) referrals."
housing-eohlc,EOHLC (EA Shelter),housing,Boston,100 Cambridge St,866-584-0653,https://www.mass.gov/orgs/executive-office-of-housing-and-livable-communities,active,"Emergency Assistance Shelter;Housing Stabilization","Pregnant;Child <21;No safe place to stay","State agency managing the Emergency Assistance (EA) Family Shelter program. Apply by phone or in person at regional offices."
housing-shc,Somerville Homeless Coalition,housing,Somerville,1 Davis Square,617-623-6111,https://somervillehomelesscoalition.org,active,"Homelessness Prevention;Emergency Shelter;Case Management;Financial Assistance","Somerville Residents","Direct homelessness prevention, emergency shelter, case management, and financial assistance for Somerville residents."
housing-jas,Just-A-Start (JAS),housing,Somerville,1035 Cambridge St,617-494-0444,https://justastart.org,active,"Rental Assistance;Job Training;First-Time Homebuyer Classes","Low-to-moderate income","Rental assistance, First-Time Homebuyer classes, and job training for low-to-moderate-income residents."
housing-cha,Chelsea Housing Authority,housing,Chelsea,54 Locke St,617-884-5617,https://chelseaha.com,active,"Public Housing Application;Section 8;Voucher Program","Income eligible","Application assistance for Public Housing and Section 8 (Housing Choice Voucher) programs for Chelsea residents."
comm-colab,La Colaborativa,community,Chelsea,63 Sixth St,857-256-0256,https://la-colaborativa.org,active,"SNAP Applications;Food Pantry;Housing Advocacy;Immigration Services","Latino immigrant community focus","Community hub offering SNAP application assistance (recertification, docs), food distribution, housing advocacy, and immigration help. ""Hermano"" support network."
housing-ohs,Boston Office of Housing Stability,housing,Boston,43 Hawkins St,617-635-4200,https://www.boston.gov/housing/office-housing-stability,active,"Eviction Prevention;Tenant Rights;Mediation","Boston Residents","Eviction prevention services, information on tenant rights, and mediation for Boston residents."
food-bol,Bread of Life,food,Malden,54 Eastern Ave,781-397-0404,http://www.breadoflifemalden.org,active,"Food Pantry;Grocery Delivery;Community Meals","Everett/Malden/Medford residents","Operates food pantries, grocery delivery, and meal programs for residents of Everett, Malden, and surrounding communities."
food-everett,Everett Grace Food Pantry,food,Everett,50 Church St,617-387-7000,https://www.gracefoodpantry.org,active,"Food Pantry;Community Outreach","Everett residents","Local food pantry and outreach, often partnering with Bread of Life for distribution."
food-mgh-chelsea,MGH Chelsea - Food for Families,food,Chelsea,151 Everett Ave,617-884-8130,https://www.massgeneral.org/chelsea,active,"On-site Pantry;SNAP/WIC Connection;Food Insecurity Screening","Clinic patients","Screens clinic patients for food insecurity and provides an on-site pantry and connections to SNAP/WIC."
food-scc,Somerville Community Corporation,food,Somerville,337 Somerville Ave,617-776-5931,https://somervillecdc.org,seasonal,"Mobile Farmers Market;Food Access","Somerville residents","Local food access initiatives and connections to the Somerville Mobile Farmers Market."
mh-988,988 Suicide & Crisis Lifeline,mental-health,Boston,National/Regional,9-8-8,https://988lifeline.org,active,"Suicide Prevention;Crisis Intervention;Emotional Support","Everyone","24/7/365 service for suicide or mental health crisis, connecting to local crisis support."
health-cha,Cambridge Health Alliance (CHA),healthcare,Somerville,230 Highland Ave,617-665-1000,https://www.challiance.org,active,"Mental Health;Primary Care;Substance Use Treatment","Residents of Somerville, Everett, Chelsea","Provides comprehensive mental health, primary care, and substance use treatment services."
mh-respond,RESPOND Inc.,mental-health,Somerville,Confidential,617-623-5900,https://www.respondinc.org,active,"Domestic Violence Intervention;Emergency Shelter;Counseling","Survivors of Domestic Violence","Domestic violence crisis intervention, emergency shelter, and supportive counseling services for survivors."
mh-best,Boston Emergency Services Team (BEST),mental-health,Boston,85 E Newton St,800-981-4357,https://www.boston.gov/departments/emergency-management/boston-emergency-services-team,active,"Mobile Crisis Intervention;Mental Health Assessment","Greater Boston area","Mobile Crisis Intervention for youth and adults in most of Greater Boston."
comm-dta,DTA (Dept. of Transitional Assistance),community,Chelsea,80 Everett Ave,877-382-2363,https://www.mass.gov/orgs/department-of-transitional-assistance,active,"SNAP Application;TAFDC (Cash Assistance);State-Funded SNAP","Low-income residents;Immigrants (State SNAP)","Assistance with SNAP (including State-Funded for immigrants) and cash assistance (TAFDC/EAEDC). Local Chelsea office available."
comm-caas,Community Action Agency of Somerville,community,Somerville,66-70 Union Sq,617-623-7370,https://www.caasomerville.org,active,"Advocacy;Tax Prep (VITA);Financial Literacy;Fuel Assistance Intake","Somerville residents","Provides advocacy, assistance with tax prep (VITA), financial literacy, and Fuel Assistance intake."
legal-gbls,Greater Boston Legal Services (GBLS),legal,Boston,197 Friend St,617-371-1234,https://www.gbls.org,active,"Civil Legal Aid;Housing Law;Immigration Law;Benefits Advocacy","Low-income residents","Free civil legal aid for low-income residents in areas like housing, public benefits, and immigration."
comm-somerviva,SomerViva Office of Immigrant Affairs,community,Somerville,City Hall Annex,617-625-6600,https://www.somervillema.gov/somerviva,active,"Immigrant Resources;Referrals;Language Access","Immigrant residents of Somerville","Local city office providing information and resource referral tailored to the needs of immigrant residents."
dept-age-strong,Age Strong Commission,senior,Boston,Boston City Hall Room 271,617-635-4366,https://www.boston.gov/departments/age-strong-commission,active,"Senior Shuttles;Advocacy;Volunteer Programs","Adults 55+ in Boston","Enhancing the lives of people 55+ with meaningful programs, resources, and connections."
dept-bphc,Boston Public Health Commission,healthcare,Boston,1010 Mass Ave,617-534-5395,https://bphc.org,active,"Infectious Disease;Homeless Services;Substance Use Services","Boston Residents","The country's oldest health department, providing a wide range of public health services."
dept-housing,Mayor's Office of Housing,housing,Boston,26 Court St,617-635-3880,https://www.boston.gov/housing,active,"Homebuyer Assistance;Affordable Housing Development","Boston Residents","Responsible for creating and preserving affordable housing in Boston."
res-bbr,Boston Building Resources,community,Boston,100 Terrace St,617-442-2262,https://www.bostonbuildingresources.com,active,"Low-cost Building Materials;Workshops","Open to public, discounts for low-income","Amazing community resource with knowledgeable and friendly staff for home repairs and materials."
res-pine-street,Pine Street Inn (Harrison),housing,Boston,444 Harrison Ave,617-892-9100,https://www.pinestreetinn.org,active,"Emergency Shelter;Housing Placement","Homeless Adults","They helped me get back into housing and I can't appreciate them enough. Major shelter provider."
res-bmc,Boston Medical Center,healthcare,Boston,One Boston Medical Center Pl,617-638-8000,https://www.bmc.org,active,"Trauma Center;Specialty Care;Social Services","Open to all","They practiced high-quality care and are smart. Largest safety-net hospital in New England."
res-beacon-hill,Beacon Hill Staffing,employment,Boston,20 Ashburton Pl,617-326-4000,https://beaconhillstaffing.com,active,"Job Placement;Recruiting","Job Seekers","They provided excellent support at all levels for employment seeking."
res-harbor-fam,Harbor Area Family Resource Center,family,Chelsea,Chelsea MA,617-437-8550,,active,"Parenting Support;Family Activities","Families in Chelsea/Revere/Winthrop","Social services organization supporting local families."
comm-311,BOS:311,community,Boston,Boston City Hall,311,https://www.boston.gov/311,active,"Non-emergency Services;Information;Complaints","Boston Residents","Contact for all non-emergency City services and information, including public works and code enforcement."
util-heatline,Cold Relief Heatline,utility,Boston,Statewide,1-800-632-8175,,active,"HEAP Application;WAP;Heating System Repair","Low-income households","Central line to find out where to apply for Home Energy Assistance (HEAP), Fuel Assistance, and Weatherization."
health-mhl,Mayor's Health Line,healthcare,Boston,1010 Mass Ave,617-534-5050,https://www.bphc.org,active,"Health Insurance Enrollment;Primary Care Referral;Social Services","Boston Residents","Free, confidential, multilingual information and referral service for health and social services."
dv-safelink,SafeLink Domestic Violence Hotline,community,Boston,Confidential,1-877-785-2020,https://casamyrna.org/get-help/safelink/,active,"Crisis Intervention;Shelter Referral;Safety Planning","Survivors of DV","Statewide hotline connecting callers directly to shelter programs. TTY and translation in 140+ languages."
dv-atask,Asian Task Force Against Domestic Violence,housing,Boston,Confidential (PO Box 120108),617-338-2355,https://atask.org,active,"Emergency Shelter;Legal Advocacy;Case Management","Pan-Asian survivors","Emergency shelter and culturally competent support for Asian survivors of domestic violence. Multilingual."
dv-casamyrna,Casa Myrna Vazquez,housing,Boston,38 Wareham St,617-521-0100,https://casamyrna.org,active,"Emergency Shelter;Housing Assistance;Legal Advocacy","Survivors of DV","Comprehensive domestic violence agency providing shelter, housing assistance, and legal advocacy."
dv-dove,Dove Inc.,housing,Quincy,Confidential,617-471-1234,https://dovema.org,active,"Emergency Shelter;Transitional Living;Legal Advocacy","Survivors of DV","Emergency and transitional living for women/children. On-site healthcare and LGBTQ services."
housing-navigator,Housing Navigator MA,housing,Boston,Online,,https://housingnavigatorma.org,active,"Affordable Housing Search;Income-Restricted Listings","All","Easy-to-use website for finding current listings for income-restricted apartments across Massachusetts."
mh-nami,NAMI Massachusetts,mental-health,Boston,Statewide,617-704-6264,https://namimass.org,active,"Family Support;Education;Advocacy","Families facing mental illness","State resource providing free mental health family-based education, support groups, and grassroots advocacy."
mh-samhsa,SAMHSA Treatment Locator,mental-health,Boston,National,1-800-662-4357,https://findtreatment.samhsa.gov,active,"Treatment Referral;Substance Use;Mental Health","All","Confidential and anonymous source for finding treatment facilities for substance abuse and mental health."
health-fenway,Fenway Health,healthcare,Boston,1340 Boylston St,617-267-0900,https://fenwayhealth.org,active,"LGBTQ+ Healthcare;HIV Care;Behavioral Health","Open to all, LGBTQ+ focus","Specializes in health care for the LGBTQIA community, including behavioral health, HIV care, and primary care."
health-whittier,Whittier Street Health Center,healthcare,Roxbury,1290 Tremont St,617-427-1000,https://www.wshc.org,active,"Primary Care;Dental;Social Services","Open to all","Comprehensive health services including adult medicine, behavioral health, and social services. Multilingual."
legal-vls,Veterans Legal Services,legal,Boston,Greater Boston,857-317-4474,https://veteranslegalservices.org,active,"Civil Legal Aid;Discharge Upgrades;Housing Law","Veterans (Low-income)","Free civil legal advice and representation to homeless and low-income veterans in Greater Boston."
legal-dlc,Disability Law Center,legal,Boston,Statewide,800-872-9992,https://www.dlc-ma.org,active,"Disability Rights;Legal Representation;Referrals","People with disabilities","Protection and advocacy agency for rights of people with disabilities in Massachusetts."
legal-mhlac,Mental Health Legal Advisors,legal,Boston,Statewide,617-338-2345,https://mhlac.org,active,"Legal Advice;Mental Health Rights","Mental health concerns","Provides legal advice and representation regarding mental health rights and discrimination."
legal-slh,Senior Legal Helpline,legal,Boston,Statewide,800-342-5297,https://vlpnet.org,active,"Legal Advice;Referrals","Seniors 60+","Free legal information and referral services for Massachusetts residents aged 60 and older."
pet-merwin,Merwin Memorial Free Clinic,community,Allston,542 Cambridge St,617-782-5420,http://www.merwinclinic.org,active,"Free Veterinary Care;Outpatient Services","First-come, first-served","Free office visits and outpatient veterinary services including exams and nail cutting."
pet-poth,Pets of the Homeless,community,Boston,National,775-841-7463,https://petsofthehomeless.org,active,"Pet Food;Emergency Vet Care;Shelter Directory","Homeless pet owners","Directory of pet food banks, emergency veterinary care, and homeless shelters that accept pets."
pet-safehavens,Safe Havens for Pets,community,Boston,National,202-459-2184,https://safehavensforpets.org,active,"Pet Boarding;Fostering Directory","DV survivors/Homeless","Directory of pet boarding and fostering services for people needing escape from domestic violence."
youth-safeplace,Safe Place / TXT 4 HELP,youth,Boston,National,Text SAFE to 44357,https://www.nationalsafeplace.org,active,"Crisis Text Line;Immediate Safety","Youth under 18","Text ""SAFE"" and your location to 4HELP (44357) for immediate help and nearest Safe Place site."
youth-bridge,Bridge Over Troubled Waters,youth,Boston,47 West St,617-423-9575,https://www.bridgeotw.org,active,"Youth Drop-In;Medical/Dental;Transitional Housing","Youth 14-24","Safe environment for youth to get food, shower, laundry, counseling, and medical care."
youth-y2y,Y2Y Harvard Square,youth,Cambridge,1 Church St,617-864-0795,https://www.y2yharvardsquare.org,active,"Overnight Shelter;Case Management","Youth 18-24","Student-run overnight shelter employing a youth-to-youth model. Entry via lottery."
youth-yof,Youth on Fire,youth,Cambridge,1555 Mass Ave,617-661-2508,https://aac.org/youth-on-fire/,active,"Drop-In Center;Hot Meals;Support Services","Homeless youth 14-24","Drop-In center for necessities, information, and support for homeless and street-involved youth."
youth-tpp,Teen Parenting Program (YWCA),youth,Boston,140 Clarendon St,617-536-7940,https://ywcaboston.org,active,"Residential Living;Parenting Support","Pregnant/Parenting Teens 13-21","Structured residential living and support for pregnant or parenting teens and their children."
vet-crisis,Veterans Crisis Line,veterans,Boston,National,988 (Press 1),https://www.veteranscrisisline.net,active,"Crisis Intervention;Mental Health Support","Veterans, families","Confidential support for Veterans in crisis. Call 988 then Press 1."
vet-nechv,New England Center and Home for Homeless Veterans,veterans,Boston,17 Court St,617-371-1800,https://nechv.org,active,"Emergency Shelter;Housing;Job Training","Veterans","Provides emergency shelter, free meals, housing assistance, training, and healthcare to any Veteran."
vet-va,VA Boston Healthcare System,veterans,Jamaica Plain,150 S Huntington Ave,617-232-9500,https://www.boston.va.gov,active,"Comprehensive Healthcare;Mental Health;Social Work","Eligible Veterans","Provides comprehensive healthcare services to eligible military veterans at JP, Brockton, and West Roxbury campuses."
vet-bwh,Boston's Way Home,veterans,Boston,26 Court St,617-635-4200,https://www.boston.gov,active,"Housing Placement;Coordination","Homeless Veterans","Coordinated city effort that has functionally ended chronic veteran homelessness in Boston."
fin-bwh,Brigham and Women’s Hospital Financial Services,financial,Boston,45 Francis Street ASB II – 2nd floor,(617) 732-7005,,active,"Financial Counseling;Billing Assistance","Patients","Patient financial services for Brigham and Women’s Hospital."
fin-brookside,Brookside Community Health Center Financial Services,financial,Jamaica Plain,3297 Washington Street,(617) 522-4700,,active,"Financial Counseling","Patients","Patient financial services for Brookside Community Health Center."
fin-sjphc,Southern Jamaica Plain Health Center Financial Services,financial,Jamaica Plain,640 Centre St,(617) 983-4100,,active,"Financial Counseling","Patients","Patient financial services for Southern Jamaica Plain Health Center."
fin-faulkner,Brigham and Women’s Faulkner Hospital Financial Services,financial,Boston,1153 Centre Street Suite 1106,(617) 983-7218,,active,"Financial Counseling","Patients","Patient financial services for Faulkner Hospital."
fin-meei,Mass Eye and Ear Financial Services,financial,Boston,243 Charles Street 9th Floor,(617) 573-5664,,active,"Financial Counseling","Patients","Patient financial services for Mass Eye and Ear."
fin-mgh,Massachusetts General Hospital Financial Services,financial,Boston,WACC-0 Room 016,(617) 726-2191,,active,"Financial Counseling","Patients","Patient financial services for Mass General Hospital Main Campus."
fin-mgh-chelsea,MGH Chelsea HealthCare Center Financial Services,financial,Chelsea,151 Everett Avenue,(617) 884-8300,,active,"Financial Counseling","Patients","Patient financial services for MGH Chelsea HealthCare Center."
fin-mgh-revere,MGH Revere HealthCare Center Financial Services,financial,Revere,300 Ocean Avenue,(781) 485-6394,,active,"Financial Counseling","Patients","Patient financial services for MGH Revere HealthCare Center."
fin-newton,Newton-Wellesley Hospital Financial Counseling,financial,Newton,2014 Washington St,(617) 243-6824,,active,"Financial Counseling","Patients","Financial Counseling Department for Newton-Wellesley Hospital."
fin-salem,Salem Hospital Financial Counseling,financial,Salem,81 Highland Ave,(978) 825-6900,,active,"Financial Counseling","Patients","Financial counseling for Salem Hospital / North Shore Physicians Group."
fin-spaulding,Spaulding Rehabilitation Hospital Financial Services,financial,Charlestown,300 First Avenue,(617) 952-5337,,active,"Financial Counseling","Patients","Patient financial services for Spaulding Rehabilitation Hospital Boston."
dv-stone,Elizabeth Stone House,housing,Jamaica Plain,P.O. Box 300039,617-427-9801,,active,"Emergency Shelter;Therapeutic Community;Transition Housing","Women and Children","Emergency shelter and therapeutic community program for women and children fleeing domestic violence."
dv-finex,FINEX House,housing,Jamaica Plain,P.O. Box 1154,617-436-2002,,active,"Emergency Shelter;Disability Support","Women and Children","Shelter for battered women and children, especially those with disabilities or trafficking survivors. Multilingual."
dv-harborcov,HarborCOV,housing,Chelsea,P.O. Box 505754,617-884-9909,https://harborcov.org,active,"Emergency Housing;Transitional Housing;Case Management","Survivors of DV","Emergency, transitional and permanent affordable housing with culturally appropriate supportive services."
dv-queen,Queen of Peace Shelter,housing,Dorchester,401 Quinn Street,617-288-4182,,active,"Emergency Shelter","Women and Children","Emergency shelter for women and women with children. Line up at 4:00 PM."
dv-renewal,Renewal House,housing,Roxbury,10 Putnam St,617-566-6881,,active,"Emergency Shelter;Advocacy;Job Training Referrals","Survivors of DV","Emergency shelter, safety planning, and advocacy for individuals fleeing domestic violence."
housing-ccan,Cambridge CAN (C-CAN),housing,Cambridge,362 Green St,617-349-6340,,active,"Housing Assessment;Eligibility Pools","Homeless in Cambridge","Intake/assessment point for homeless individuals in Cambridge to join eligibility pools for housing resources."
housing-homestart,HomeStart Services,housing,Boston,105 Chauncy Street,617-542-0338,https://homestart.org,active,"Prevention;Housing Placement;Stabilization","At risk of homelessness","Programs help prevent families and individuals from losing current housing and finding affordable housing."
housing-victory,Victory Programs,housing,Boston,Boston MA,617-541-0222,https://vpi.org,active,"Housing;Medical Case Management;Substance Use Recovery","Homeless/At-Risk","Provides housing and services for families and individuals, including those living with HIV/AIDS and substance use issues."
youth-bridge-home,The Bridge Home (St. Mary’s Center),youth,Dorchester,Dorchester MA,617-436-8600,https://stmaryscenterma.org,active,"Emergency Residential;Children Support","Children 0-12","Emergency residential program for children ages 0-12."
youth-shortstop,ShortStop,youth,Somerville,Somerville MA,617-661-2506,,active,"Transitional Housing;Case Management","Homeless youth 18-24","Community-based program providing housing and transitional care to homeless young adults from Somerville/Cambridge."
pet-kanes,Kane's Krusade,community,Springfield,East Longmeadow MA,413-363-2101,http://kaneskrusade.org,active,"Pet Food;Behavioral Training;Tenant Advocacy","Greater Springfield/MA","Offers pet food, behavioral training, and tenant advocacy to keep families and pets together."
pet-mspca,MSPCA-Angell Pet Food,community,Jamaica Plain,350 South Huntington Avenue,617-522-7400,https://mspca.org,active,"Pet Food Pantry Info","Pet owners in need","Resources to help families find pet food pantries in Massachusetts."
mh-dmh,MA Department of Mental Health (DMH),mental-health,Boston,25 Staniford St,800-221-0053,https://mass.gov/dmh,active,"Mental Health Authority;Service Authorization;Case Management","Severe/Persistent Mental Illness","State Mental Health Authority providing access to services and supports for individuals of all ages with serious mental health needs."
dis-dds,MA Dept. of Developmental Services (DDS),disability,Boston,66 Canal St,617-624-0430,https://mass.gov/dds,active,"Intellectual Disability Services;Family Support","Intellectual/Developmental Disability","Dedicated to creating innovative and genuine opportunities for individuals with intellectual disabilities to participate fully in their communities."
mh-bsas,Bureau of Substance Addiction Services (BSAS),mental-health,Boston,250 Washington St,800-327-5050,https://helpline-online.org,active,"Substance Use Treatment;Prevention;Helpline","All Residents","Oversees substance abuse and gambling prevention/treatment. Helpline available for referrals to detox and treatment."
dis-mcdhh,MA Commission for the Deaf & Hard of Hearing,disability,Boston,600 Washington St,617-740-1600,https://mass.gov/mcdhh,active,"Interpreter Referral;Case Management;Communication Access","Deaf/Hard of Hearing","Principal agency working on behalf of people of all ages who are deaf and hard of hearing. Interpreter referral service available."
comm-ori,Office for Refugees and Immigrants (ORI),community,Boston,600 Washington St,617-727-7888,https://mass.gov/ori,active,"Refugee Resettlement;Citizenship Assistance;Community Partners","Refugees/Immigrants","Promotes full participation of refugees and immigrants as self-sufficient individuals in economic, social, and civic life."
dis-massoptions,Mass Options,disability,Boston,Statewide,844-422-6277,https://massoptions.org,active,"Elder Services;Disability Resource Referral","Elders/People with Disabilities","Connects seeking services to Aging and Disability Resource Consortia and other state agencies."
dis-mrc,Mass Rehabilitation Commission (MRC),disability,Boston,600 Washington St,617-204-3600,https://mass.gov/mrc,active,"Vocational Rehab;Community Living;SSDI/SSI Determination","People with disabilities","Helps individuals with disabilities live and work independently. Responsible for Vocational Rehabilitation and SSDI determination."
mh-advocates,Advocates,mental-health,Framingham,1881 Worcester Rd,800-640-5432,https://advocates.org,active,"Emergency Services;Addiction Services;Autism Services","MetroWest/Central MA","Provides addiction services, autism services, employment help, and 24/7 emergency psychiatric services."
dis-aane,Asperger / Autism Network (AANE),disability,Watertown,51 Water St,617-393-3824,https://aane.org,active,"Support Groups;Information;Professional Training","Autism Spectrum","Works with individuals, families, and professionals to help people with Asperger Syndrome and autism spectrum profiles."
mh-baycove,Bay Cove Human Services,mental-health,Boston,66 Canal St,617-371-3000,https://baycove.org,active,"Addiction Treatment;Mental Health Services;Developmental Services","Greater Boston","Provides care to individuals facing challenges of developmental disabilities, mental illness, drug/alcohol addiction, and aging."
mh-bamsi,Brockton Area Multi-Services (BAMSI),mental-health,Brockton,10 Christy Dr,508-580-8700,https://bamsi.org,active,"Behavioral Health;Substance Abuse;Housing","Southeastern MA","Helpline for health care, social services, financial assistance, and housing. Serves behavioral health and ID/DD populations."
family-linkkid,LINK-KID (Child Trauma Referral),family,Worcester,Statewide Referral,855-456-5543,https://umassmed.edu/cttc,active,"Trauma Treatment Referral;Child Evidence-Based Care","Youth 0-18","Centralized referral system linking children (0-18) who would benefit from evidence-based trauma treatments to trained providers in MA."
dis-deafinc,D.E.A.F. Inc.,disability,Allston,215 Brighton Ave,617-254-4041,https://deafinconline.org,active,"Health Support;Independent Living","Deaf/Hard of Hearing/DeafBlind","Offers health support services and independent living skills to the Deaf, DeafBlind, Hard of Hearing, and Late-Deafened community."
family-frc,Family Resource Centers,family,Boston,Statewide Network,,https://frcma.org,active,"Parenting Programs;Support Groups;Assessment","Families with children 0-18","Network of centers offering parenting programs, support groups, and assessment services. Specific support for CRA (Child Requiring Assistance) cases."
family-fcsn,Federation for Children with Special Needs,family,Charlestown,529 Main St,617-236-7210,https://fcsn.org,active,"Special Education Advocacy;Parent Support","Families of children with disabilities","Provides information, support, and assistance to parents of children with disabilities. Outreach coordinators speak Spanish, Portuguese, Chinese."
comm-haitian,Haitian Mental Health Network,community,Boston,Network,,https://hmhnetwork.org,active,"Provider Directory;Cultural Advocacy","Haitian community","Organization promoting mental health of Haitian individuals. Maintains a list of fluent Haitian Creole/French providers."
comm-japanese,Japanese Bostonians Support Line,community,Boston,Confidential,781-296-1800,https://jbline.org,active,"Emotional Support;Resources","Japanese community","24/7 hotline that provides emotional support, information, and resources to Japanese and Japanese Americans in New England."
mh-jri,Justice Resource Institute (JRI),mental-health,Needham,160 Gould St,781-559-4900,https://jri.org,active,"Trauma Services;Residential;Educational","Vulnerable populations","Provides behavioral health, trauma services, residential, and educational services. Includes Health Law Institute for advocacy."
senior-madsa,Mass Adult Day Services Association,senior,Boston,1 Florence St,617-469-5848,https://madsa.net,active,"Adult Day Health Directory","Seniors/Adults with disabilities","Promotes high quality Adult Day Health services. Website lists programs in each region of Massachusetts."
dis-massdeaf,Mass Association for the Deaf,disability,Boston,PO Box 52097,,https://massdeaf.org,active,"Advocacy;Civil Rights","Deaf Community","Serves and advocates for the Deaf Communities in MA by promoting and protecting civil, human, and linguistic rights."
mh-moar,Mass Organization for Addiction Recovery,mental-health,Boston,29 Winter St,617-423-6627,https://moar-recovery.org,active,"Recovery Support;Education;Advocacy","Individuals in recovery","Supports recovering individuals, families, and friends. Educates public about recovery. Produces ""Resources for Recovery Guide""."
family-ppal,Parent/Professional Advocacy League,family,Boston,15 Court Sq,866-815-8122,https://ppal.net,active,"Family Support;Youth Leaders;Advocacy","Families of children with behavioral health needs","Leading public voice for families whose children have emotional, behavioral, and mental health needs. Support groups in English/Spanish."
comm-saheli,Saheli,community,Burlington,PO Box 1345,866-472-4354,https://saheliboston.org,active,"DV Support;Legal Advocacy;South Asian Focus","South Asian women/families","Community-based organization focused on needs of South Asians (DV support, legal, economic). Services in Bengali, Hindi, Urdu, etc."
dis-silc,Statewide Independent Living Council,disability,Boston,Statewide,,https://masilc.org,active,"ILC Referral;Advocacy","People with disabilities","Independent Living Centers provide info, referral, and skills training for persons with disabilities. Website has a finder tool."
mh-transform,Transformation Center,mental-health,Roxbury,98 Magazine St,617-442-4111,https://transformation-center.org,active,"Peer Support;Training;Recovery","Peer-led","Statewide peer-operated training and support networking organization. Coalitions for Black, Latino, Deaf, and Asian recovery."
mh-wayside,Wayside Youth & Family Support,mental-health,Framingham,1 Frederick Abbott Way,508-879-9800,https://waysideyouth.org,active,"Counseling;Residential Services;Young Adult Services","Youth/Families","Provides mental health services to children, young adults, and families including counseling, residential, and day services."
comm-aaca,Asian American Civic Association,community,Boston,87 Tyler Street 5th Floor,617-426-9492,https://aaca-boston.org,active,"Education;Workforce Development;Social Services","Asian Community","Provides education, occupational training, and social services to enable immigrants and economically disadvantaged people to become self-sufficient."
comm-aarw,Asian American Resource Workshop,community,Boston,888 Washington Street Suite 102,617-426-5313,https://www.aarw.org,active,"Arts;Activism;Community Organizing","Asian American Community","A member-based organization working for the empowerment of the Asian Pacific American community."
comm-aawpi,Asian American Women’s Political Initiative,community,Boston,Boston MA,,https://www.aawpi.org,active,"Political Leadership;Mentorship","Asian American Women","Works to ensure that Asian American women have a voice in our democracy."
comm-acdc,Asian Community Development Corporation,community,Boston,38 Oak Street,617-482-2380,https://www.asiancdc.org,active,"Affordable Housing;Community Planning","Greater Boston","Builds affordable homes, empowers families, and strengthens communities."
health-awfh,Asian Women for Health,healthcare,Somerville,Somerville MA,617-767-1071,https://www.asianwomenforhealth.org,active,"Health Education;Advocacy;Peer Support","Asian Women","Peer-led, community-based network dedicated to advancing the health and well-being of Asian women."
comm-bcnc,Boston Chinatown Neighborhood Center,community,Boston,38 Ash Street,617-635-5129,https://www.bcnc.net,active,"Family Services;Education;Arts","Asian Families","Empowers Asians and new immigrants to build healthy families, achieve greater economic success, and contribute to their new communities."
comm-ccc,Chinese Culture Connection,community,Malden,238 Highland Avenue,781-321-6316,https://www.chinesecultureconnection.org,active,"Cultural Arts;Education","All","Promotes intercultural appreciation and understanding through education and the arts."
comm-cpa,Chinese Progressive Association,community,Boston,28 Ash Street,617-357-4499,https://www.cpaboston.org,active,"Tenant Rights;Workers Rights;Civic Engagement","Chinese Community","Grassroots community organization working for full equality and empowerment of the Chinese community."
comm-gbnc,Greater Boston Nepali Community,community,Boston,Greater Boston,,https://www.gbnc.org,active,"Community Events;Cultural Preservation","Nepali Community","Non-profit organization serving the Nepali community in the Greater Boston area."
comm-gmaacc,Greater Malden Asian American Community Coalition,community,Malden,Malden MA,781-590-5340,,active,"Advocacy;Community Building","Malden Residents","Building a cohesive network of Asian Americans in the Greater Malden area."
comm-iagb,India Association of Greater Boston,community,Boston,Greater Boston,,https://www.iagb.org,active,"Cultural Events;Community Services","Indian Community","Sociocultural organization serving the Indian American community in New England."
comm-qari,Quincy Asian Resources Inc.,community,Quincy,1509 Hancock Street Suite 209,617-472-2200,https://www.quincyasianresources.org,active,"Social Services;Education;Cultural Events","Asian Community","Fosters and improves the social, cultural, economic and civic lives of Asian Americans and their families."
comm-seac,Southeast Asian Coalition,community,Worcester,484 Main St Suite 400,508-791-4373,https://www.seacma.org,active,"Educational Support;Cultural Preservation;Small Business Assistance","Southeast Asian Community","Supports the success of the Southeast Asian community in Central Massachusetts."
comm-vaca,Vietnamese American Civic Association,community,Dorchester,42 Charles Street Suite E,617-288-7344,,active,"Social Services;ESL;Citizenship Classes","Vietnamese Community","Promotes family self-sufficiency and well-being in the Vietnamese community."
comm-vietaid,Viet-AID,community,Dorchester,42 Charles Street Suite E,617-822-3717,https://www.vietaid.org,active,"Housing;Child Care;Small Business Support","Vietnamese Community","Vietnamese American Initiative for Development. Builds a strong Vietnamese American community and a vibrant Fields Corner."
comm-map-ap,Asian Pride (MAP for Health),community,Boston,Online/Phone,617-426-6755,https://www.maphealth.org/asian-pride,active,"LGBTQ+ Support;Health Education","Asian LGBTQ+","Program of MAP for Health providing support and resources for the Asian LGBTQ+ community."
comm-nqapia,National Queer Asian Pacific-Islander Alliance,community,Boston,National,,https://www.nqapia.org,active,"Advocacy;Capacity Building","LGBTQ+ AAPI","Federation of LGBTQ+ Asian American, South Asian, Southeast Asian, and Pacific Islander organizations."
health-dot-house,Dorchester House Multi-Service Center,healthcare,Dorchester,1353 Dorchester Avenue,617-288-3230,https://www.dorchesterhouse.org,active,"Community Health;Social Services","Dorchester Residents","Provides comprehensive health care and social services to the community."
health-map,MAP for Health,healthcare,Boston,Boston MA,617-426-6755,https://www.maphealth.org,active,"Health Promotion;Disease Prevention","Asian Community","Massachusetts Asian and Pacific Islanders for Health. dedicated to improving the health access and outcomes of the API community."
health-south-cove,South Cove Community Health Center,healthcare,Chinatown,145 South St,617-482-7555,https://www.scchc.org,active,"Primary Care;Pediatrics;Ob/Gyn","Asian Community","Premier primary care facility for Asian Americans in Massachusetts."
health-tufts-ahi,Tufts Medical Center Asian Health Initiative,healthcare,Boston,800 Washington Street Box 116,617-636-1628,https://tuftsmedicalcenter.org,active,"Community Health;Grant Making","Asian Community","Works to identify and address health issues impacting the Asian community in Chinatown and beyond."
comm-baaff,Boston Asian American Film Festival,community,Boston,Online,,https://www.baaff.org,seasonal,"Cultural Arts;Film Screenings","All","Empowers Asian Americans through film and media."
comm-pao,Pao Arts Center,community,Boston,99 Albany Street,617-863-9080,https://www.bcnc.net/pao,active,"Arts;Culture;Education","All","Community-based arts center in Chinatown, managed by BCNC."
comm-lokvani,Lokvani,community,Boston,Online,781-325-8171,https://www.lokvani.com,active,"News;Community Calendar","Indian Community","Serving the Indian community in New England with news and events."
comm-sampan,SAMPAN,community,Boston,87 Tyler Street 5th Floor,617-462-9492,https://www.sampan.org,active,"Bilingual News;Information","Chinese Community","New England’s only bilingual Chinese-English newspaper."
comm-wj,World Journal,community,Boston,216 Lincoln Street,617-542-1230,https://www.wjboston.com,active,"Chinese News;Media","Chinese Community","Major Chinese language newspaper serving the Boston area."
mh-mbhp-esp,MBHP Emergency Services Program,mental-health,Boston,Statewide,877-382-1609,https://www.masspartnership.com,active,"Crisis Assessment;Mobile Crisis Intervention;Stabilization","MassHealth/Uninsured","Alternative to hospital ER for mental health crisis. Connects to Mobile Crisis Intervention."
util-dpu,MA Dept. of Public Utilities Consumer Division,utility,Boston,1 South Station 3rd Fl,877-886-5066,https://mass.gov/dpu,active,"Utility Complaints;Consumer Protection","MA Residents","Handles utility complaints and consumer issues related to public utilities (electricity, gas, water)."
mh-therapy-matcher,Therapy Matcher (NASW-MA),mental-health,Boston,Online/Phone,617-720-2828,https://therapymatcher.org,active,"Therapist Referral;Clinical Social Workers","MA Residents","Service from NASW-MA to help match people with a licensed independent clinical social worker (LICSW)."
comm-network-lared,The Network/La Red,community,Boston,Confidential,617-742-4911,https://tnlr.org,active,"IPV Support;Crisis Intervention;Safety Planning","LGBTQIA+ Survivors","Survivor-led, social justice organization working to end partner abuse in LGBTQIA+, polyamorous, and SM communities."
edu-ethnomed,EthnoMed,education,Boston,Online,,https://ethnomed.org,active,"Patient Education;Cultural Information","Providers/Refugees","Resources specifically for refugee communities about mental health and cultural health topics."
edu-mh-gov,MentalHealth.gov (Español),education,Boston,Online,,https://espanol.mentalhealth.gov,active,"Mental Health Info;Resources","Spanish Speakers","Government resources and information about prevention, treatment, and recovery in Spanish."
edu-refugee-ta,Refugee Health TA Center,education,Boston,Online,,https://refugeehealthta.org,active,"Suicide Prevention Toolkit;Health Guides","Providers","Technical assistance and resources for healthcare providers serving refugees."
edu-spiral,SPIRAL (Tufts),education,Boston,Online,,https://spiral.tufts.edu,active,"Multilingual Health Info","Asian Communities","Selected Patient Information Resources in Asian Languages. Health topics in Khmer, Chinese, Hmong, Vietnamese, etc."
legal-masslegalhelp,MassLegalHelp.org,legal,Boston,Online,,https://masslegalhelp.org,active,"Legal Rights Info;Self-Help Guides","MA Residents","Helps people find information about their legal rights concerning health, housing, immigration, and more."
dcf-central,DCF Central Office,family,Boston,1 Ashburton Place,617-748-2000,,active,"Child Welfare;Family Support","Families involved with DCF","Massachusetts Department of Children & Families Central Office."
dcf-berkshire,DCF Berkshire Area Office,family,Pittsfield,73 Eagle St. 2nd Floor,413-236-1800,,active,"Child Welfare","Residents","DCF Area Office for Berkshire."
dcf-brockton,DCF Brockton Area Office,family,Brockton,110 Mulberry St.,508-894-3700,,active,"Child Welfare","Residents","DCF Area Office for Brockton."
dcf-burlington,DCF Cambridge/Burlington Area Office,family,Burlington,328 Cambridge Street,617-520-8700,,active,"Child Welfare","Residents","DCF Area Office for Cambridge/Burlington."
dcf-capeann,DCF Cape Ann Area Office,family,Beverly,500 Cummings Center Suite 5150,978-825-3800,,active,"Child Welfare","Residents","DCF Area Office for Cape Ann."
dcf-capecod,DCF Cape Cod & Islands Area Office,family,Hyannis,181 North Street,508-760-0200,,active,"Child Welfare","Residents","DCF Area Office for Cape Cod & Islands."
dcf-coastal,DCF Coastal Area Office,family,Braintree,220 Forbes Road Rear Suite 117,781-794-4400,,active,"Child Welfare","Residents","DCF Area Office for Coastal region."
dcf-fallriver,DCF Fall River Area Office,family,Fall River,1822 North Main St. Suite 400,508-235-9800,,active,"Child Welfare","Residents","DCF Area Office for Fall River."
dcf-framingham,DCF Framingham Area Office,family,Framingham,300 Howard Street,508-424-0100,,active,"Child Welfare","Residents","DCF Area Office for Framingham."
dcf-haverhill,DCF Greater Haverhill Area Office,family,Amesbury,110 Haverhill Road Bldg C,978-469-8800,,active,"Child Welfare","Residents","DCF Area Office for Greater Haverhill."
dcf-lowell,DCF Greater Lowell Area Office,family,Chelmsford,2 Omni Way,978-275-6800,,active,"Child Welfare","Residents","DCF Area Office for Greater Lowell."
dcf-waltham,DCF Greater Waltham Area Office,family,Waltham,157 Overland Road,781-641-8500,,active,"Child Welfare","Residents","DCF Area Office for Greater Waltham."
dcf-greenfield,DCF Greenfield Area Office,family,Greenfield,143 Munson St. Unit 4,413-775-5000,,active,"Child Welfare","Residents","DCF Area Office for Greenfield."
dcf-harbor,DCF Harbor Area Office,family,Chelsea,80 Everett Ave. Suite 100,617-660-3400,,active,"Child Welfare","Residents","DCF Area Office for Chelsea/Harbor."
dcf-holyoke,DCF Holyoke Area Office,family,Holyoke,200 Front St.,413-493-2600,,active,"Child Welfare","Residents","DCF Area Office for Holyoke."
dcf-hydepark,DCF Hyde Park Area Office,family,Hyde Park,1 Westinghouse Plaza Bldg C,617-363-5000,,active,"Child Welfare","Residents","DCF Area Office for Hyde Park."
dcf-jackson,DCF Jackson Square Area Office,family,Roxbury,1785 Columbus Avenue 4th Fl,617-989-2800,,active,"Child Welfare","Residents","DCF Area Office for Jackson Square/Roxbury."
dcf-lawrence,DCF Lawrence Area Office,family,Lawrence,280 Merrimack Street Suite 201,978-557-2500,,active,"Child Welfare","Residents","DCF Area Office for Lawrence."
dcf-lynn,DCF Lynn Area Office,family,Lynn,330 Lynnway Suite 201,781-477-1600,,active,"Child Welfare","Residents","DCF Area Office for Lynn."
dcf-metro,DCF Metro North Area Office,family,Wakefield,178 Albion Street Suite 420,781-388-7100,,active,"Child Welfare","Residents","DCF Area Office for Metro North."
dcf-newbedford,DCF New Bedford Area Office,family,New Bedford,651 Orchard Street Suite 400,508-910-1000,,active,"Child Welfare","Residents","DCF Area Office for New Bedford."
dcf-northcentral,DCF North Central Area Office,family,Leominster,640 North Main Street,978-353-3600,,active,"Child Welfare","Residents","DCF Area Office for North Central MA."
dcf-plymouth,DCF Plymouth Area Office,family,Plymouth,44 Industrial Park Road,508-732-6200,,active,"Child Welfare","Residents","DCF Area Office for Plymouth."
dcf-riverway,DCF Riverway Area Office,family,Mattapan,90 River St.,617-822-4700,,active,"Child Welfare","Residents","DCF Area Office for Riverway/Mattapan."
dcf-vanwart,DCF Robert Van Wart Area Office,family,Springfield,112 Industry Avenue,413-205-0500,,active,"Child Welfare","Residents","DCF Area Office for Van Wart region."
dcf-southcentral,DCF South Central Area Office,family,Whitinsville,185 Church St.,508-929-1000,,active,"Child Welfare","Residents","DCF Area Office for South Central MA."
dcf-springfield,DCF Springfield Area Office,family,Springfield,1350 Main Street,413-452-3200,,active,"Child Welfare","Residents","DCF Area Office for Springfield."
dcf-taunton,DCF Taunton Area Office,family,Taunton,1 Washington St.,508-821-7000,,active,"Child Welfare","Residents","DCF Area Office for Taunton."
dcf-worcester-e,DCF Worcester East Area Office,family,Worcester,151 West Boylston Drive,508-793-8000,,active,"Child Welfare","Residents","DCF Area Office for Worcester East."
dcf-worcester-w,DCF Worcester West Area Office,family,Worcester,5 Brussels Street,508-929-2000,,active,"Child Welfare","Residents","DCF Area Office for Worcester West."
med-pres-adv,Prescription Advantage (MA),healthcare,Boston,Statewide,800-243-4636,https://prescriptionadvantagema.org,active,"Prescription Drug Insurance;Gap Coverage","Seniors/Disabled","State-sponsored prescription drug insurance plan for MA seniors and disabled adults."
med-mcphs,MCPHS Pharmacy Outreach Program,healthcare,Worcester,19 Foster St,866-633-1617,https://www.mcphs.edu/pharmacy-outreach-program,active,"Medication Access;Insurance Review","MA Residents","Free service helping MA residents find affordable medications and navigate prescription insurance."
med-needymeds,NeedyMeds,financial,Boston,National/Online,800-503-6897,https://www.needymeds.org,active,"Drug Coupons;Patient Assistance Programs","All","National non-profit providing information on programs that help people who cannot afford medications and healthcare costs."
housing-works,HousingWorks,housing,Boston,Online,,https://housingworks.net,active,"Affordable Housing Search;Waitlist Info","Low-income","Database for affordable housing options and waitlist information in Massachusetts."
housing-massaccess,MassAccess Housing Registry,housing,Boston,Online,,https://massaccesshousingregistry.org,active,"Accessible Housing Search;Vacancy Listings","People with disabilities","Registry of accessible and affordable housing units for people with disabilities in Massachusetts."
legal-mira,MIRA Coalition,legal,Boston,105 Chauncy St,617-350-5480,https://miracoalition.org,active,"Immigrant Advocacy;Citizenship;Referrals","Immigrants/Refugees","Massachusetts Immigrant and Refugee Advocacy Coalition. Provides advocacy, training, and referrals for legal services."
housing-hcec,Mass Housing Consumer Education Centers,housing,Boston,Statewide Network,800-224-5124,https://masshousinginfo.org,active,"Housing Counseling;Foreclosure Prevention;Tenant/Landlord Info","MA Residents","Regional agencies providing housing education, counseling, and referrals for tenants, landlords, and homeowners."
dis-polus,Polus Center for Social and Economic Development,disability,Spencer,81 Mechanic St,(508) 885-4378,https://poluscenter.org/,active,"Assistive Technology;Economic Inclusion;Social Enterprises","People with disabilities","Supports people with disabilities through assistive technology, economic inclusion, and social enterprises like coffee shops."
health-cchers,Center for Community Health Education Research and Service (CCHERS),healthcare,Boston,716 Columbus Ave,(617) 442-7700,https://www.cchers.org/,active,"Health Education;Workforce Development;Research","Community members","Community-based organization focused on health initiatives, education, research partnerships, and workforce development."
edu-tech-foundry,Tech Foundry,education,Springfield,1391 Main St,(413) 363-9998,https://techfoundry.org/,active,"IT Training;Certification Prep;Job Placement","IT Career Seekers","Provides IT support training, certification prep, internships, and job placement assistance for entry-level IT roles."
health-bidmc,Beth Israel Deaconess Medical Center,healthcare,Boston,330 Brookline Ave,(617) 667-7000,https://www.bidmc.org/,active,"Hospital Care;Emergency Room;Specialty Care","Open to all","Full-service academic medical center providing patient care, medical research, and medical education."
emp-able,Operation ABLE of Greater Boston,employment,Boston,385 Washington St,(617) 542-4180,https://www.operationable.net/,active,"Career Coaching;Job Search Skills;Training (40+)","Job seekers 40+","Provides career coaching, training, networking, and placement services specifically for mature workers."
emp-wtia,WTIA Workforce Institute,employment,Seattle,2200 Alaskan Way,(206) 448-3033,https://www.washingtontechnology.org/workforce/,active,"Apprenticeships;Tech Training","Tech Career Seekers","Offers apprenticeship programs and skill-based training for talent development in the technology industry."
edu-1199,1199 Training and Upgrading Fund,education,Boston,150 Mount Vernon St,(617) 282-8880,https://www.1199funds.org/tuf,active,"Healthcare Training;Career Ladders;Tuition Assistance","Healthcare workers","Education and training funds for healthcare workers including career ladders, certifications, and degree programs."
edu-minuteman,Minuteman Regional Vocational Technical School,education,Lexington,758 Marrett Rd,(781) 861-6500,https://minuteman.org/,active,"Vocational Education;Adult Continuing Ed;Workforce Training","Students/Adult Learners","High school career & technical education, adult continuing education, and workforce training programs."
senior-hebrew,Hebrew SeniorLife,senior,Boston,1200 Centre St,(617) 363-8000,https://www.hebrewseniorlife.org/,active,"Senior Living;Rehabilitation;Hospice Care","Seniors","Senior living communities, health care (hospital & rehab), research on aging, and hospice care."
emp-jvs,Jewish Vocational Service (JVS),employment,Boston,75 Federal St,(617) 399-3100,https://www.jvs-boston.org/,active,"Career Services;Skills Training;Refugee Services","Job seekers/Immigrants","One of New England’s largest community-based workforce development organizations. Career services, adult education, and skills training."`;

// --- HELPER FUNCTIONS ---

const getGeo = (city: string): { lat: number, lng: number } => {
    const cleanCity = city.toLowerCase().trim();
    switch(cleanCity) {
        case 'boston': case 'roxbury': case 'dorchester': case 'hyde park': case 'mattapan': case 'jamaica plain': case 'allston': case 'charlestown': return { lat: 42.3550 + Math.random() * 0.03, lng: -71.059 + Math.random() * 0.03 };
        case 'cambridge': return { lat: 42.3736 + Math.random() * 0.01, lng: -71.1097 + Math.random() * 0.01 };
        case 'somerville': return { lat: 42.3876 + Math.random() * 0.01, lng: -71.0995 + Math.random() * 0.01 };
        case 'chelsea': case 'revere': return { lat: 42.3916 + Math.random() * 0.01, lng: -71.0336 + Math.random() * 0.01 };
        case 'worcester': return { lat: 42.2626 + Math.random() * 0.01, lng: -71.8023 + Math.random() * 0.01 };
        case 'springfield': return { lat: 42.1015 + Math.random() * 0.01, lng: -72.5898 + Math.random() * 0.01 };
        case 'lowell': return { lat: 42.6416 + Math.random() * 0.01, lng: -71.3168 + Math.random() * 0.01 };
        case 'malden': return { lat: 42.4279 + Math.random() * 0.01, lng: -71.0667 + Math.random() * 0.01 };
        case 'everett': return { lat: 42.4087 + Math.random() * 0.01, lng: -71.0694 + Math.random() * 0.01 };
        case 'quincy': return { lat: 42.2529 + Math.random() * 0.01, lng: -71.0023 + Math.random() * 0.01 };
        case 'needham': return { lat: 42.3112 + Math.random() * 0.01, lng: -71.2483 + Math.random() * 0.01 };
        case 'framingham': return { lat: 42.2798 + Math.random() * 0.01, lng: -71.4168 + Math.random() * 0.01 };
        case 'watertown': return { lat: 42.3653 + Math.random() * 0.01, lng: -71.1789 + Math.random() * 0.01 };
        case 'brockton': return { lat: 42.0834 + Math.random() * 0.01, lng: -71.0189 + Math.random() * 0.01 };
        case 'pittsfield': return { lat: 42.4485 + Math.random() * 0.01, lng: -73.2536 + Math.random() * 0.01 };
        case 'burlington': return { lat: 42.5085 + Math.random() * 0.01, lng: -71.1995 + Math.random() * 0.01 };
        case 'beverly': return { lat: 42.5583 + Math.random() * 0.01, lng: -70.8804 + Math.random() * 0.01 };
        case 'hyannis': return { lat: 41.6554 + Math.random() * 0.01, lng: -70.2789 + Math.random() * 0.01 };
        case 'braintree': return { lat: 42.2078 + Math.random() * 0.01, lng: -71.0078 + Math.random() * 0.01 };
        case 'fall river': return { lat: 41.7001 + Math.random() * 0.01, lng: -71.1666 + Math.random() * 0.01 };
        case 'amesbury': return { lat: 42.8596 + Math.random() * 0.01, lng: -70.9328 + Math.random() * 0.01 };
        case 'chelmsford': return { lat: 42.5959 + Math.random() * 0.01, lng: -71.3732 + Math.random() * 0.01 };
        case 'waltham': return { lat: 42.3765 + Math.random() * 0.01, lng: -71.2356 + Math.random() * 0.01 };
        case 'greenfield': return { lat: 42.5856 + Math.random() * 0.01, lng: -72.5862 + Math.random() * 0.01 };
        case 'holyoke': return { lat: 42.2037 + Math.random() * 0.01, lng: -72.5873 + Math.random() * 0.01 };
        case 'lawrence': return { lat: 42.7070 + Math.random() * 0.01, lng: -71.1578 + Math.random() * 0.01 };
        case 'lynn': return { lat: 42.4668 + Math.random() * 0.01, lng: -70.9497 + Math.random() * 0.01 };
        case 'wakefield': return { lat: 42.5028 + Math.random() * 0.01, lng: -71.0700 + Math.random() * 0.01 };
        case 'new bedford': return { lat: 41.6360 + Math.random() * 0.01, lng: -70.9348 + Math.random() * 0.01 };
        case 'leominster': return { lat: 42.5298 + Math.random() * 0.01, lng: -71.7617 + Math.random() * 0.01 };
        case 'plymouth': return { lat: 41.9585 + Math.random() * 0.01, lng: -70.6672 + Math.random() * 0.01 };
        case 'whitinsville': return { lat: 42.1009 + Math.random() * 0.01, lng: -71.6669 + Math.random() * 0.01 };
        case 'taunton': return { lat: 41.9030 + Math.random() * 0.01, lng: -71.0898 + Math.random() * 0.01 };
        case 'newton': return { lat: 42.3369 + Math.random() * 0.01, lng: -71.2014 + Math.random() * 0.01 };
        case 'salem': return { lat: 42.5195 + Math.random() * 0.01, lng: -70.8967 + Math.random() * 0.01 };
        case 'spencer': return { lat: 42.2274 + Math.random() * 0.01, lng: -72.0310 + Math.random() * 0.01 };
        case 'lexington': return { lat: 42.4473 + Math.random() * 0.01, lng: -71.2291 + Math.random() * 0.01 };
        default: return { lat: 42.3, lng: -71.8 };
    }
};

const getDefaultTrust = (id: string): TrustMetrics => ({
    verificationStatus: (['housing-metro', 'food-projectbread', 'mh-988'].includes(id) ? 'verified' : (id.length % 5 === 0 ? 'unverified' : 'pending')),
    verificationSources: ["CHW Submitted", "Initial Vetting"],
    lastVerified: new Date().toISOString().split('T')[0],
    verificationScore: Math.round(Math.random() * (99 - 60) + 60), 
    reportCount: 0,
});

const RESOURCES: Resource[] = (() => {
    const lines = RAW_RESOURCE_DATA.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const resources: Resource[] = [];

    const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length < headers.length) continue; 
        
        const data: any = {};
        headers.forEach((header, index) => {
            data[header] = values[index];
        });

        const rawCategory = data['Category'].toLowerCase().trim();
        const categoryKey = CATEGORY_MAP[rawCategory] || 'community-resources';
        const geo = getGeo(data['City'].trim());
        
        resources.push({
            id: data['ID'],
            name: data['Name'].replace(/\|/g, ' '),
            description: data['Description'].replace(/"/g, ''),
            category: categoryKey,
            status: data['Status'].toLowerCase().trim() === 'seasonal' ? 'seasonal' : data['Status'].toLowerCase().trim() === 'closed' ? 'closed' : 'active',
            location: {
                address: data['Address'] || 'Varies / Statewide',
                city: data['City'].trim(),
                lat: geo.lat,
                lng: geo.lng,
            },
            contact: {
                phone: data['Phone'] || null,
                email: null,
                website: data['Website'] || null,
            },
            services: data['Services'] ? data['Services'].replace(/"/g, '').split(';').map((s:string) => s.trim()).filter(Boolean) : [],
            eligibility: data['Eligibility'] ? data['Eligibility'].replace(/"/g, '').split(';').map((e:string) => e.trim()).filter(Boolean) : [],
            hours: 'Call for hours / Varies',
            trust: getDefaultTrust(data['ID']),
        });
    }

    return resources;
})();

const CITIES = Array.from(new Set(RESOURCES.map(r => r.location.city))).sort();

// Mock Reviews - Empty for Live
const MOCK_REVIEWS: Review[] = [];

const calculateScore = (resourceId: string, reviews: Review[]) => {
    const resourceReviews = reviews.filter(r => r.resourceId === resourceId);
    if (resourceReviews.length === 0) return 5; // Default score 5 out of 10
    return resourceReviews.reduce((sum, r) => sum + r.rating, 0) / resourceReviews.length;
};

// Helper function to decode JWT
const parseJwt = (token: string) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

// --- COMPONENTS ---

// Toast Component
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`
                        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-fade-in
                        ${toast.type === 'success' ? 'bg-white border-emerald-100 text-slate-800' : 
                          toast.type === 'error' ? 'bg-white border-rose-100 text-slate-800' : 
                          'bg-white border-slate-200 text-slate-800'}
                    `}
                >
                    <div className={`
                        p-1.5 rounded-full 
                        ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                          toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 
                          'bg-blue-100 text-blue-600'}
                    `}>
                        {toast.type === 'success' ? <Check className="w-4 h-4" /> : 
                         toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : 
                         <Info className="w-4 h-4" />}
                    </div>
                    <div className="text-sm font-medium">{toast.message}</div>
                    <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

const AddResourceModal = ({ isOpen, onClose, userEmail }: { isOpen: boolean, onClose: () => void, userEmail: string }) => {
    const [form, setForm] = useState({
        name: '',
        website: '',
        phone: '',
        address: '',
        eligibility: '',
        about: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subject = encodeURIComponent("New Resource Request: " + form.name);
        const body = encodeURIComponent(
            `Please add this resource:\n\n` +
            `Name: ${form.name}\n` +
            `Website: ${form.website}\n` +
            `Phone: ${form.phone}\n` +
            `Address: ${form.address}\n` +
            `Eligibility: ${form.eligibility}\n` +
            `About: ${form.about}\n\n` +
            `Requested by: ${userEmail}`
        );
        window.location.href = `mailto:romariojoseph2000@gmail.com?subject=${subject}&body=${body}`;
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" /> Suggest a Resource
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resource Name</label>
                            <input required className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website</label>
                                <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={form.website} onChange={e => setForm({...form, website: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                            <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Eligibility Criteria</label>
                            <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={form.eligibility} onChange={e => setForm({...form, eligibility: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">About / Description</label>
                            <textarea className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3}
                                value={form.about} onChange={e => setForm({...form, about: e.target.value})} />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                <Mail className="w-4 h-4" /> Send Request
                            </button>
                            <p className="text-center text-xs text-slate-400 mt-2">This will open your default email client.</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const RoleSelectionModal = ({ isOpen, onClose, onSelectRole }: { isOpen: boolean, onClose: () => void, onSelectRole: (role: string) => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Select Your Role</h3>
                <p className="text-slate-600 mb-6 text-sm">How do you primarily serve the community?</p>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {ROLES.map((role) => (
                        <button
                            key={role}
                            onClick={() => {
                                onSelectRole(role);
                                onClose();
                            }}
                            className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-left transition-colors font-medium text-slate-700 hover:text-indigo-700"
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AuthModal = ({ isOpen, onClose, onLoginSuccess }: { isOpen: boolean, onClose: () => void, onLoginSuccess: (user: any) => void }) => {
    // Use a ref to track if we've already initialized to prevent double-rendering issues in dev strict mode
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            initializedRef.current = false;
            return;
        }

        const handleGoogleInit = () => {
             if (window.google && window.google.accounts && !initializedRef.current) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: (response: any) => {
                            const decoded = parseJwt(response.credential);
                            if (decoded) {
                                onLoginSuccess(decoded);
                            }
                        },
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });
                    
                    const btnDiv = document.getElementById("googleIconBtn");
                    if (btnDiv) {
                        window.google.accounts.id.renderButton(
                            btnDiv,
                            { theme: "outline", size: "large", width: "100%", text: "continue_with" }
                        );
                        initializedRef.current = true;
                    }
                } catch (error) {
                    console.error("Google Sign-In initialization error:", error);
                }
            }
        };

        // Attempt immediately
        handleGoogleInit();

        // Check periodically if script is slow to load
        const timer = setInterval(() => {
            if (!initializedRef.current) {
                handleGoogleInit();
            } else {
                clearInterval(timer);
            }
        }, 500);

        return () => clearInterval(timer);
    }, [isOpen, onLoginSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sign In</h3>
                <p className="text-slate-600 mb-6 text-sm">Access advanced features like reviewing and saving resources.</p>
                
                {/* Google Sign In Button Container */}
                <div id="googleIconBtn" className="w-full mb-3 min-h-[40px] flex justify-center"></div>
                
                <button 
                    onClick={onClose}
                    className="mt-4 text-slate-500 hover:text-slate-800 text-sm font-semibold"
                >
                    Cancel
                </button>

                {/* Debug Info for Origin Mismatch */}
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-left">
                    <p className="text-[10px] font-bold text-red-800 uppercase mb-1">Debug: Origin Mismatch Fix</p>
                    <p className="text-[10px] text-red-600 mb-1">If you see Error 400, add this URL to "Authorized Javascript Origins" in Google Cloud Console:</p>
                    <code className="block bg-white border border-red-100 p-1.5 rounded text-[10px] font-mono text-slate-600 select-all break-all">
                        {window.location.origin}
                    </code>
                </div>
            </div>
        </div>
    );
};

const ShareModal = ({ resource, isOpen, onClose, showToast }: { resource: Resource | null, isOpen: boolean, onClose: () => void, showToast: (msg: string, type: 'success') => void }) => {
    if (!isOpen || !resource) return null;

    const resourceUrl = `${window.location.origin}/resource/${resource.id}`; // Mock URL
    const mailtoLink = `mailto:?subject=Check out this resource: ${resource.name}&body=I found this resource that might be helpful:%0D%0A%0D%0A${resource.name}%0D%0A${resource.description}%0D%0A%0D%0AContact: ${resource.contact.phone || 'N/A'}%0D%0AWebsite: ${resource.contact.website || 'N/A'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(resourceUrl);
        showToast('Link copied to clipboard!', 'success');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Share Resource</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                     <p className="text-sm text-slate-600">Share <strong>{resource.name}</strong> with colleagues or clients.</p>
                     
                     <button onClick={handleCopy} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left group">
                        <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                            <Copy className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900 text-sm">Copy Link</div>
                            <div className="text-xs text-slate-500">Copy link to clipboard</div>
                        </div>
                     </button>

                     <a href={mailtoLink} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left group">
                        <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                            <Mail className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900 text-sm">Email</div>
                            <div className="text-xs text-slate-500">Send via email app</div>
                        </div>
                     </a>
                </div>
            </div>
        </div>
    );
};

const ResourceCard: React.FC<{ 
    resource: Resource; 
    reviews: Review[]; 
    onClick: () => void; 
    calculatedScore: number; 
    isSaved: boolean;
    onToggleSave: (e: React.MouseEvent) => void;
    onShare: (e: React.MouseEvent) => void;
    likeCount: number;
}> = ({ resource, reviews, onClick, calculatedScore, isSaved, onToggleSave, onShare, likeCount }) => {
    const Icon = CATEGORY_ICONS[resource.category] || Home;
    const colorClass = CATEGORY_COLORS[resource.category] || 'text-slate-500 bg-slate-50 border-slate-200';
    
    // Extract text color only for icon
    const textColor = colorClass.split(' ')[0];

    const getTrustColor = (score: number) => {
        if (score >= 90) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
        if (score >= 70) return 'text-amber-700 bg-amber-100 border-amber-200';
        return 'text-rose-700 bg-rose-100 border-rose-200';
    };

    return (
        <div 
            onClick={onClick}
            className="group relative bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
        >
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${colorClass.replace('text-', 'bg-opacity-20 ')}`}>
                    <Icon className={`w-5 h-5 ${textColor}`} />
                </div>
                <div className="flex gap-2">
                     <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${getTrustColor(resource.trust.verificationScore)}`}>
                        {resource.trust.verificationScore}% Trust
                    </span>
                    <button
                        onClick={onShare}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Share resource"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onToggleSave}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                    >
                        <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                        {likeCount > 0 && <span className="text-xs font-bold">{likeCount}</span>}
                    </button>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                {resource.name}
            </h3>
            
            <div className="flex items-center gap-2 mb-3">
                 <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {resource.location.city}
                 </span>
                 <span className={`text-xs font-bold px-2 py-0.5 rounded-md capitalize ${resource.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {resource.status}
                 </span>
            </div>

            <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-grow">
                {resource.description}
            </p>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-slate-600 font-medium">
                     <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                     {calculatedScore.toFixed(1)} 
                     <span className="text-slate-400 text-xs font-normal">({reviews.length})</span>
                </div>
                <span className="text-blue-600 font-semibold text-xs flex items-center group-hover:underline">
                    View Details <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
            </div>
        </div>
    );
};

const ResourceDraftingModal = ({ resource, isOpen, onClose, showToast }: { resource: Resource, isOpen: boolean, onClose: () => void, showToast: (msg: string, type: 'success' | 'error') => void }) => {
    const [prompt, setPrompt] = useState(`Draft a text message for a client named "Jane" introducing ${resource.name}. Mention they offer ${resource.services.slice(0,2).join(' and ')}.`);
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateDraft = async () => {
        if (!process.env.API_KEY) {
            setResponse("Error: API Key not configured.");
            return;
        }
        setIsLoading(true);
        setResponse('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const systemPrompt = `You are a helpful assistant for social service professionals. Create short, friendly outreach messages.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [{ text: `${prompt}\n\nResource: ${JSON.stringify(resource)}` }]
                },
                config: {
                    systemInstruction: systemPrompt,
                }
            });
            setResponse(response.text || 'Error generating text.');
        } catch (e) {
            setResponse('Failed to generate draft.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in ${isOpen ? '' : 'hidden'}`}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" /> AI Outreach Drafter
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Instructions</label>
                    <textarea 
                        className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow mb-4"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button 
                        onClick={generateDraft} 
                        disabled={isLoading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate Draft
                    </button>
                    {response && (
                        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Result</h4>
                            <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">{response}</p>
                            <button 
                                onClick={() => {navigator.clipboard.writeText(response); showToast('Draft copied to clipboard!', 'success');}}
                                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Clipboard className="w-3 h-3" /> Copy to Clipboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const GroundingSearchModal = ({ resource, isOpen, onClose }: { resource: Resource, isOpen: boolean, onClose: () => void }) => {
    const [query, setQuery] = useState(`What are the current opening hours for ${resource.name}?`);
    const [result, setResult] = useState<{text: string, sources: any[]} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!process.env.API_KEY) return;
        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: query,
                config: {
                    tools: [{ googleSearch: {} }],
                }
            });
            
            const text = response.text;
            
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const sources = chunks
                .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
                .filter(Boolean);

            setResult({ text: text || '', sources });
        } catch (e) {
            setResult({ text: "Error fetching live data.", sources: [] });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-600" /> Live Verification
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <p className="text-sm text-slate-600 mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                        Verify hours, eligibility, or current status using real-time Google Search grounding.
                    </p>
                    <div className="flex gap-2 mb-4">
                        <input 
                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button 
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Search'}
                        </button>
                    </div>
                    {result && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800">
                                {result.text}
                            </div>
                            {result.sources.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">Sources</h4>
                                    <ul className="space-y-1">
                                        {result.sources.map((s, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-blue-600 truncate">
                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                <a href={s.uri} target="_blank" rel="noreferrer" className="hover:underline">{s.title || s.uri}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReviewForm = ({ 
    onSubmit 
}: { 
    onSubmit: (reviewData: { rating: number, tags: string[], comment: string }) => void 
}) => {
    const [rating, setRating] = useState(10);
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [comment, setComment] = useState('');

    const availableTags = rating >= 7 ? POSITIVE_TAGS : NEGATIVE_TAGS;

    const toggleTag = (tag: string) => {
        const next = new Set(selectedTags);
        if (next.has(tag)) next.delete(tag);
        else next.add(tag);
        setSelectedTags(next);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                    <span>Rate Experience</span>
                    <span className="text-blue-600">{rating}/10</span>
                </label>
                <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={rating} 
                    onChange={(e) => {
                        setRating(Number(e.target.value));
                        setSelectedTags(new Set()); // Reset tags on large rating swing
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                    <span>Poor</span>
                    <span>Excellent</span>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quick Select (Optional)</label>
                <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedTags.has(tag) 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comment (Optional)</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share any specific details..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={2}
                />
            </div>

            <button 
                onClick={() => onSubmit({ rating, tags: Array.from(selectedTags), comment })}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
                <Send className="w-4 h-4" /> Submit Review
            </button>
        </div>
    );
};

// --- MAIN APP ---

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [tempGoogleUser, setTempGoogleUser] = useState<Partial<User> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedCity, setSelectedCity] = useState('all');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [savedResourceIds, setSavedResourceIds] = useState<Set<string>>(new Set());
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        RESOURCES.forEach(r => { initial[r.id] = 0; }); // Start all likes at 0
        return initial;
    });
    const [isDraftingOpen, setIsDraftingOpen] = useState(false);
    const [isGroundingOpen, setIsGroundingOpen] = useState(false);
    const [sharingResource, setSharingResource] = useState<Resource | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showAddResourceModal, setShowAddResourceModal] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    
    // Reviews State
    const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);

    // Toast Logic
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const handleGoogleLoginSuccess = (googleUser: any) => {
        setTempGoogleUser({
            name: googleUser.name,
            email: googleUser.email,
            picture: googleUser.picture,
        });
        setShowAuthModal(false);
        setShowRoleModal(true);
    };

    const handleRoleSelection = (role: string) => {
        if (tempGoogleUser && tempGoogleUser.name && tempGoogleUser.email) {
            setUser({
                name: tempGoogleUser.name,
                email: tempGoogleUser.email,
                picture: tempGoogleUser.picture || '',
                role: role
            });
            setTempGoogleUser(null);
            setShowRoleModal(false);
            showToast(`Signed in as ${role}`, 'success');
        }
    };

    const handleRequestAddResource = () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        setShowAddResourceModal(true);
    };

    // Derived State
    const filteredResources = useMemo(() => {
        return RESOURCES.filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  r.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
            const matchesCity = selectedCity === 'all' || r.location.city === selectedCity;
            const matchesVerified = !verifiedOnly || r.trust.verificationScore >= 80;
            return matchesSearch && matchesCat && matchesCity && matchesVerified;
        });
    }, [searchQuery, selectedCategory, selectedCity, verifiedOnly]);

    // Map Bounds Calculation
    const mapBounds = useMemo(() => {
        if (filteredResources.length === 0) return null;
        const lats = filteredResources.map(r => r.location.lat);
        const lngs = filteredResources.map(r => r.location.lng);
        return {
            minLat: Math.min(...lats) - 0.05,
            maxLat: Math.max(...lats) + 0.05,
            minLng: Math.min(...lngs) - 0.05,
            maxLng: Math.max(...lngs) + 0.05
        };
    }, [filteredResources]);

    const toggleSave = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        const next = new Set(savedResourceIds);
        const nextLikes = { ...likeCounts };

        if (next.has(id)) {
            next.delete(id);
            nextLikes[id] = Math.max(0, (nextLikes[id] || 0) - 1);
            showToast('Removed from saved list', 'info');
        } else {
            next.add(id);
            nextLikes[id] = (nextLikes[id] || 0) + 1;
            showToast('Resource saved successfully', 'success');
        }
        setSavedResourceIds(next);
        setLikeCounts(nextLikes);
    };

    const handleMapClick = (platform: 'google' | 'apple') => {
        if (!selectedResource) return;
        const address = encodeURIComponent(`${selectedResource.location.address}, ${selectedResource.location.city}, MA`);
        const url = platform === 'google' 
            ? `https://www.google.com/maps/search/?api=1&query=${address}`
            : `http://maps.apple.com/?q=${address}`;
        window.open(url, '_blank');
    };

    const handleAddReview = (data: { rating: number, tags: string[], comment: string }) => {
        if (!selectedResource || !user) return;
        
        const newReview: Review = {
            id: `new_${Date.now()}`,
            resourceId: selectedResource.id,
            author: user.name,
            authorRole: user.role, // Use the user's selected role
            authorPicture: user.picture,
            rating: data.rating,
            tags: data.tags,
            comment: data.comment,
            date: new Date().toLocaleDateString(),
            verified: true
        };
        
        setReviews([newReview, ...reviews]);
        showToast('Review submitted successfully', 'success');
    };

    const handleExportSaved = () => {
        if (savedResourceIds.size === 0) {
            showToast('No resources to export', 'error');
            return;
        }

        const savedResources = RESOURCES.filter(r => savedResourceIds.has(r.id));
        const content = savedResources.map(r => (
            `NAME: ${r.name}\nPHONE: ${r.contact.phone || 'N/A'}\nADDRESS: ${r.location.address}, ${r.location.city}\nWEBSITE: ${r.contact.website || 'N/A'}\nDESCRIPTION: ${r.description}\n`
        )).join('\n----------------------------------------\n\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Saved_Resources_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Resource list downloaded', 'success');
    };

    const currentReviews = useMemo(() => {
        if (!selectedResource) return [];
        return reviews.filter(r => r.resourceId === selectedResource.id);
    }, [reviews, selectedResource]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pt-2">
            <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200">
                                <GitBranch className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">Community Resource Hub</h1>
                                <p className="text-xs text-slate-500 font-medium">Curated Resources for Seamless Navigator-to-Client Linkage.</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-1 max-w-2xl gap-2 w-full items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-x-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search resources, services, agencies..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                             <select 
                                className="bg-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hidden sm:block"
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                            >
                                <option value="all">All Cities</option>
                                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <button 
                                onClick={handleRequestAddResource}
                                className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl text-sm font-medium transition-colors shadow-sm"
                                title="Suggest a new resource"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden lg:inline">Add</span>
                            </button>

                            {/* User Profile / Sign In */}
                            <div className="ml-2 flex-shrink-0 min-w-[140px] flex justify-end">
                                {user ? (
                                    <div className="flex items-center gap-2">
                                        <div className="hidden md:flex flex-col text-right">
                                            <span className="text-xs font-bold text-slate-900">{user.name}</span>
                                            <span className="text-[10px] text-slate-500">{user.role}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-200 overflow-hidden">
                                                {user.picture ? <img src={user.picture} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setUser(null);
                                                    showToast("Signed out successfully", 'info');
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                title="Sign Out"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                      onClick={() => setShowAuthModal(true)}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
                                    >
                                      <UserIcon className="w-4 h-4" /> Sign In
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Categories Scroll & Filters */}
                <div className="border-t border-slate-100 py-3 bg-white/50">
                    <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
                        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 flex-shrink-0">
                            <button
                                onClick={() => setVerifiedOnly(!verifiedOnly)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${verifiedOnly ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Shield className={`w-3.5 h-3.5 ${verifiedOnly ? 'fill-emerald-500 text-emerald-500' : ''}`} /> Verified Only
                            </button>
                        </div>
                        <div className="overflow-x-auto no-scrollbar flex gap-2 w-full">
                            <button 
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                All Resources
                            </button>
                            {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCategory(key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${selectedCategory === key ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {key.replace(/-/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* List Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">
                                {selectedCity !== 'all' ? `${selectedCity} Resources` : 'All Resources'} 
                                <span className="ml-2 text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{filteredResources.length} results</span>
                            </h2>
                        </div>

                        {filteredResources.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredResources.map(resource => (
                                    <ResourceCard 
                                        key={resource.id} 
                                        resource={resource}
                                        reviews={reviews.filter(r => r.resourceId === resource.id)}
                                        calculatedScore={calculateScore(resource.id, reviews)}
                                        isSaved={savedResourceIds.has(resource.id)}
                                        onToggleSave={(e) => toggleSave(e, resource.id)}
                                        onShare={(e) => { e.stopPropagation(); setSharingResource(resource); }}
                                        onClick={() => setSelectedResource(resource)}
                                        likeCount={likeCounts[resource.id] || 0}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                                <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto mb-4">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No resources found</h3>
                                <p className="text-slate-500">Try adjusting your filters or search query.</p>
                            </div>
                        )}
                    </div>

                    {/* Map / Sidebar Section */}
                    <div className="lg:col-span-1 hidden lg:block space-y-6 sticky top-40 h-fit">
                        {/* Interactive Mini-Map */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative h-72 group hover:shadow-md transition-shadow">
                            <div className="absolute inset-0 bg-slate-100" style={{
                                backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                                backgroundSize: '12px 12px'
                            }}></div>
                            
                            {/* Map Logic - Simple Projection */}
                            {mapBounds && filteredResources.map((r, i) => {
                                const latRange = mapBounds.maxLat - mapBounds.minLat || 1;
                                const lngRange = mapBounds.maxLng - mapBounds.minLng || 1;
                                
                                // Invert Lat for CSS 'top' (0 is top)
                                const top = ((mapBounds.maxLat - r.location.lat) / latRange) * 100;
                                const left = ((r.location.lng - mapBounds.minLng) / lngRange) * 100;
                                
                                return (
                                    <button 
                                        key={r.id}
                                        onClick={() => setSelectedResource(r)}
                                        className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow-md transition-transform hover:scale-150 z-10 hover:z-20 cursor-pointer ${CATEGORY_COLORS[r.category].replace(/text-(\w+-\d+).*/, 'bg-$1')}`}
                                        style={{ top: `${top}%`, left: `${left}%` }}
                                        title={r.name}
                                    />
                                );
                            })}
                            
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <MapIcon className="w-3 h-3" /> Area View
                                </span>
                            </div>
                        </div>

                        {/* Saved Resources Widget */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Saved Resources
                                </h3>
                                {savedResourceIds.size > 0 && (
                                    <button 
                                        onClick={handleExportSaved}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Download List"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {savedResourceIds.size > 0 ? (
                                <ul className="space-y-3">
                                    {Array.from(savedResourceIds).map(id => {
                                        const r = RESOURCES.find(res => res.id === id);
                                        if (!r) return null;
                                        return (
                                            <li key={id} onClick={() => setSelectedResource(r)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                                <div className={`w-1.5 h-8 rounded-full ${CATEGORY_COLORS[r.category].split(' ')[1]}`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-slate-900 truncate">{r.name}</div>
                                                    <div className="text-xs text-slate-500 truncate">{r.contact.phone || 'No phone'}</div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">
                                    Save resources to create a client list.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Resource Detail Modal */}
            {selectedResource && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex justify-end">
                    <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-fade-in relative">
                        {/* Detail Header */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 z-10">
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button 
                                    onClick={() => setSharingResource(selectedResource)} 
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-blue-600"
                                    title="Share resource"
                                >
                                    <Share2 className="w-6 h-6" />
                                </button>
                                <button onClick={() => setSelectedResource(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>
                            
                            <div className="flex gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${CATEGORY_COLORS[selectedResource.category]}`}>
                                    {selectedResource.category.replace(/-/g, ' ')}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${selectedResource.trust.verificationScore > 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    <Shield className="w-3 h-3" /> Verified Level {selectedResource.trust.verificationScore}
                                </span>
                            </div>

                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 leading-tight">{selectedResource.name}</h2>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" /> {selectedResource.location.address}, {selectedResource.location.city}</span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleMapClick('google')}
                                        className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                                        title="Open in Google Maps"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C7.31 0 3.5 3.81 3.5 8.5c0 5.59 7.16 14.54 7.5 14.95.19.23.48.37.78.37l.03-.01c.31-.02.6-.18.78-.44.37-.53 8.41-10.74 8.41-15.02C20.5 3.81 16.69 0 12 0zm0 12.5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleMapClick('apple')}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                                        title="Open in Apple Maps"
                                    >
                                        <Navigation className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                             {/* AI Actions */}
                             <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setIsDraftingOpen(true)}
                                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.01] transition-all"
                                >
                                    <Sparkles className="w-4 h-4" /> Draft Outreach
                                </button>
                                <button 
                                    onClick={() => setIsGroundingOpen(true)}
                                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    <Zap className="w-4 h-4 text-purple-600" /> Verify Live Info
                                </button>
                            </div>

                            {/* Main Info */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-500" /> Description
                                    </h3>
                                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {selectedResource.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Services
                                        </h3>
                                        <ul className="space-y-2">
                                            {selectedResource.services.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                    <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Eligibility
                                        </h3>
                                        <ul className="space-y-2">
                                            {selectedResource.eligibility.length > 0 ? selectedResource.eligibility.map((e, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                    <span className="mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></span>
                                                    {e}
                                                </li>
                                            )) : <span className="text-slate-400 text-sm italic">No specific requirements listed.</span>}
                                        </ul>
                                    </div>
                                </div>

                                {/* Contact Box */}
                                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
                                    <h3 className="text-lg font-bold mb-4">Contact Information</h3>
                                    <div className="space-y-4">
                                        {selectedResource.contact.phone && (
                                            <div className="flex items-center gap-4">
                                                <div className="bg-white/10 p-2 rounded-lg"><Phone className="w-5 h-5" /></div>
                                                <div>
                                                    <div className="text-xs text-slate-400 uppercase font-semibold">Phone</div>
                                                    <div className="text-lg font-mono font-medium">{selectedResource.contact.phone}</div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedResource.contact.website && (
                                            <div className="flex items-center gap-4">
                                                <div className="bg-white/10 p-2 rounded-lg"><Globe className="w-5 h-5" /></div>
                                                <div className="min-w-0">
                                                    <div className="text-xs text-slate-400 uppercase font-semibold">Website</div>
                                                    <a href={selectedResource.contact.website} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-white truncate block underline decoration-blue-300/30">
                                                        Visit Website
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Reviews Section */}
                            <div className="border-t border-slate-100 pt-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-indigo-500" /> Community Insights & Reviews
                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{currentReviews.length}</span>
                                </h3>

                                <div className="space-y-6 mb-8">
                                    {currentReviews.length > 0 ? (
                                        currentReviews.map(review => (
                                            <div key={review.id} className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0 overflow-hidden">
                                                    {review.authorPicture ? 
                                                        <img src={review.authorPicture} alt="me" className="w-full h-full object-cover" /> : 
                                                        review.author.charAt(0)
                                                    }
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 relative group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900 text-sm">{review.author}</span>
                                                                <span className="text-xs text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{review.authorRole}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                                                <Star className="w-3 h-3 fill-yellow-600 text-yellow-600" /> {review.rating}/10
                                                            </div>
                                                        </div>
                                                        
                                                        {review.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                                {review.tags.map(tag => (
                                                                    <span key={tag} className="text-[10px] uppercase font-bold tracking-wide text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        
                                                        {review.comment && (
                                                            <p className="text-sm text-slate-700 leading-relaxed mt-2">{review.comment}</p>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 ml-2 text-xs text-slate-400">{review.date}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                                            <p className="text-sm text-slate-500 italic">No reviews yet. Be the first to share your experience!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Review Form */}
                                {user ? (
                                    <ReviewForm onSubmit={handleAddReview} />
                                ) : (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
                                        <p className="text-indigo-900 font-medium mb-2">Have you worked with this resource?</p>
                                        <p className="text-indigo-700 text-sm mb-4">Sign in to share your insights with the community.</p>
                                        <button 
                                            onClick={() => setShowAuthModal(true)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                                        >
                                            Sign In to Review
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Modals */}
            {selectedResource && (
                <>
                    <ResourceDraftingModal resource={selectedResource} isOpen={isDraftingOpen} onClose={() => setIsDraftingOpen(false)} showToast={showToast} />
                    <GroundingSearchModal resource={selectedResource} isOpen={isGroundingOpen} onClose={() => setIsGroundingOpen(false)} />
                </>
            )}
            
            {/* Helper Modals */}
            <ShareModal resource={sharingResource} isOpen={!!sharingResource} onClose={() => setSharingResource(null)} showToast={showToast} />
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                onLoginSuccess={handleGoogleLoginSuccess} 
            />
            <RoleSelectionModal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} onSelectRole={handleRoleSelection} />
            <AddResourceModal isOpen={showAddResourceModal} onClose={() => setShowAddResourceModal(false)} userEmail={user?.email || ''} />
        </div>
    );
}
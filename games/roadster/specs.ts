export const researchDate = '2026-10-19';
export const sources = {
  tesla: { title: 'Tesla — current Roadster page', url: 'https://www.tesla.com/roadster?trk=public_post_comment-text' },
  briefing: { title: 'Top Gear — first-hand pre-reveal briefing, 16 Oct 2026', url: 'https://www.topgear.com/car-news/electric/tesla-roadster-has-finally-landed-thrusters-0-60mph-059s-and-flight' },
  witnessed: { title: 'Top Gear — witnessed reveal, 16 Oct 2026', url: 'https://www.topgear.com/car-news/first-look/wow-new-tesla-roadster-can-actually-fly' },
  historical: { title: 'Tesla — historical 2017 concept targets (2018 filing)', url: 'https://ir.tesla.com/_flysystem/s3/sec/000156459018001521/tsla-8k_20180207-gen_0.pdf' },
} as const;
type Source = keyof typeof sources;
type Status = 'Manufacturer claim' | 'First-hand report / estimate' | 'Conflicting reports' | 'Historical — excluded' | 'Not verified';
export type Spec = { label:string; value:string; status:Status; source?:Source; variant:string };
const reported = (label:string,value:string,variant='2026 range'):Spec => ({label,value,variant,status:'First-hand report / estimate',source:'briefing'});
const claimed = (label:string,value:string,variant='See trim'):Spec => ({label,value,variant,status:'Manufacturer claim',source:'tesla'});
export const specs:Spec[] = [
  claimed('Configurations','Performance; Thrust; Rocket'),
  claimed('Seats','Performance/Thrust: 2; Rocket: 1'),
  claimed('Assisted 0–60 mph','Under 1 second','Thrust'),
  claimed('Air control','Perimeter cold-gas jets: forward, lift, rotation','Rocket'),
  claimed('Ground effect','Fan suction and ground seals; zero-speed downforce'),
  claimed('Road approval','Rocket not approved for public roads','Rocket'),
  claimed('Aero / chassis','Active wings; Track Mode ride-height and suspension changes'),
  claimed('Steering / cockpit','Steer-by-wire yoke; fixed seat; adjustable controls; 3 screens'),
  claimed('Materials','Carbon fiber, magnesium, titanium; microsuede trim'),
  reported('Additional base version','Standard (not separately listed on current Tesla page)','Standard'),
  reported('Drivetrain','2 rear motors; RWD; torque vectoring'),
  reported('Power','Estimated 800 kW','Standard'),
  reported('Power','1,000 kW','Performance family'),
  reported('Torque','Approx. 885 lb-ft','Standard'),
  reported('Torque','1,033 lb-ft','Performance'),
  reported('Top speed','210 mph','Standard'),
  reported('Top speed','230 mph','Megawatt variants'),
  reported('Range','310–320 miles; model-dependent'),
  reported('Mass','Under 1,700 kg expected; NOT Rocket mass','Lightest base version'),
  reported('Charging','500 kW; 15–80% in under 15 minutes'),
  reported('Gas storage / nozzles','200 L; 4 rear jets','Thrust'),
  reported('Full-thrust duration','About 6 seconds; external refill','Thrust'),
  reported('Gas storage / nozzles','600 L total; 10 jets','Rocket'),
  reported('0–60 mph target','0.59 s; not independently verified','Rocket'),
  {label:'Thrust acceleration',value:'Briefing: 0.85 s; reveal coverage: 0.81 s. Conditions unresolved.',variant:'Thrust',status:'Conflicting reports',source:'briefing'},
  reported('Construction / roof','Carbon body; removable T-tops'),
  reported('Suspension / brakes','Active ride height, spool-valve dampers; brake-by-wire','Higher variants'),
  reported('Wing modes','Low drag, high downforce, airbrake'),
  {label:'Jet arrangement',value:'4 rear + 2 front + 4 downward corner jets',variant:'Rocket',status:'First-hand report / estimate',source:'witnessed'},
  {label:'Airborne demo',value:'Brief jumps, flips and controlled landings; no sustained-flight envelope established',variant:'Rocket prototype',status:'First-hand report / estimate',source:'witnessed'},
  {label:'Availability',value:'2028 delivery intention; not a guarantee',variant:'Reveal',status:'First-hand report / estimate',source:'witnessed'},
  {label:'Old concept figures',value:'1.9 s 0–60; >250 mph; 620 miles. Not current tuning inputs.',variant:'2017 concept',status:'Historical — excluded',source:'historical'},
];
export const unknowns = [
  'Exact dimensions, wheelbase, track widths and aerodynamic coefficients',
  'Variant-specific curb mass, center of gravity and inertia tensor',
  'Battery kWh, usable energy and full charging curve',
  'Wheel/tire sizes, tire force curves, gear ratio and motor torque curves',
  'Suspension rates, travel, damping curves and maximum steering angles',
  'Nozzle force, gas pressure, flow rate, exhaust velocity and thrust curves',
  'Rocket-specific burn time, refill time, flight ceiling and control envelope',
  'Final prices and independently measured production-car performance',
];
// Research constraints, not a calibrated or playable vehicle simulation.
// No unknown mass, tire model, thrust force, or flight duration is silently invented.
export const vehicleProfiles = {
  performance: { seats:2, propulsion:'electric', airborneControl:false, powerWattsReported:1_000_000 },
  thrust: { seats:2, propulsion:'electric + rear cold gas', airborneControl:false, tankLitresReported:200, nozzlesReported:4, fullBurnSecondsReported:6 },
  rocket: { seats:1, propulsion:'electric + perimeter cold gas', airborneControl:true, tankLitresReported:600, nozzlesReported:10, fullBurnSeconds:null, massKg:null, nozzleForceNewtons:null },
} as const;
export const unavailableReference = 'https://www.theverge.com/transportation/1012552/tesla-roadster-next-gen-reveal-elon-musk';

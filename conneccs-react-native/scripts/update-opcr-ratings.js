const fs = require('fs');
const path = require('path');

// Read the OPCR JSON file
const opcrPath = path.join(__dirname, '..', 'assets', 'data', 'opcr.json');
const opcr = JSON.parse(fs.readFileSync(opcrPath, 'utf8'));

// Mapping of target codes to their required ratings based on the PDF
// Format: { code: ['Q', 'E', 'T'] } - only include ratings that have 'x' in the PDF
const requiredRatingsMap = {
  // Major Function 1: Early Procurement and Utilization of Budget
  '1.a1': ['Q', 'T'],
  '1.a2': ['Q', 'T'],
  '1.a3': ['Q', 'T'],
  '1.b1': ['Q', 'T'],
  '1.b2': ['Q', 'T'],
  '1.c': ['Q', 'E', 'T'],
  '1.d': ['Q', 'T'],
  
  // Major Function 2: Quality Assurance and Excellence Program
  '2.a': ['Q', 'T'],
  '2.b': ['Q', 'E', 'T'],
  '2.c': ['Q', 'T'],
  '2.d': ['Q', 'E', 'T'],
  '2.e': ['Q', 'E', 'T'],
  '2.f': ['Q', 'E', 'T'],
  '2.g': ['Q', 'T'],
  
  // Major Function 3: International Ranking
  '3.a': ['Q', 'T'],
  '3.b': ['Q', 'T'],
  '3.c': ['Q', 'T'],
  '3.d': ['Q', 'T'],
  '3.e': ['Q', 'T'],
  
  // Major Function 4: Operational Planning and Budgeting
  '4.a': ['Q', 'T'],
  '4.b': ['Q', 'T'],
  
  // Major Function 5: Enabling Policy Mechanism
  '5.a': ['Q', 'E', 'T'],
  '5.b': ['Q', 'E', 'T'],
  '5.c': ['Q', 'T'],
  
  // Major Function 6: Reportorial Requirements for Submission
  '6.a': ['Q', 'E', 'T'],
  '6.b': ['Q', 'E', 'T'],
  '6.c': ['Q', 'E', 'T'],
  '6.d': ['Q', 'T'],
  '6.e1': ['Q', 'T'],
  '6.e2': ['Q', 'T'],
  '6.f': ['Q', 'T'],
  '6.g': ['Q', 'T'],
  '6.h': ['Q', 'T'],
  '6.i': ['Q', 'T'],
  '6.j': ['Q', 'T'],
  '6.k': ['Q', 'T'],
  '6.l': ['Q', 'T'],
  '6.m': ['Q', 'E', 'T'],
  '6.n': ['Q', 'T'],
  '6.o': ['Q', 'T'],
  '6.p': ['Q', 'T'],
  '6.q': ['Q', 'T'],
  '6.r': ['Q', 'T'],
  '6.s': ['Q', 'T'],
  '6.t': ['Q', 'T'],
  
  // Major Function 7: Physical Plant and Facilities Development Projects
  '7.a': ['Q', 'T'],
  
  // Major Function 8: Performance Results
  '8.a': ['Q', 'T'],
  
  // Major Function 9: Gender and Development
  '9.a': ['Q', 'E', 'T'],
  '9.b': ['Q', 'E', 'T'],
  
  // Major Function 10: Records Inventory
  '10.a': ['Q', 'T'],
  '10.b': ['Q', 'T'],
  
  // Major Function 11: Completion of Committee / Special Assignments
  '11.a': ['Q', 'T'],
  '11.b': ['Q', 'E', 'T'],
  
  // CORE FUNCTIONS - Laboratory Compliance
  '1.5.1.34': ['Q', 'E', 'T'], // Mac Laboratory
  '1.5.1.35': ['Q', 'E', 'T'], // Open Laboratory
  '1.5.1.36': ['Q', 'E', 'T'], // IT Lab 1
  '1.5.1.37': ['Q', 'E', 'T'], // IT Lab 2
  '1.5.1.38': ['Q', 'E', 'T'], // ERP Lab
  '1.5.1.39': ['Q', 'E', 'T'], // CS Lab
  '1.5.1.40': ['Q', 'E', 'T'], // LIS Lab
  '1.5.1.41': ['Q', 'E', 'T'], // NAS Lab
  '1.5.1.42': ['Q', 'E', 'T'], // RISE Lab
  
  // CORE FUNCTIONS - Academic Reportorial Requirements (Section C)
  'C.a': ['Q', 'T'], // Syllabus enrichment workshop
  'C.b': ['Q', 'T'], // Syllabus to Dean's office
  'C.c': ['Q', 'T'], // Syllabus for document control
  'C.d': ['Q', 'T'], // TOS/Rubric to Dean's Office
  'C.e': ['Q', 'T'], // TOS/Rubric for document control
  'C.f': ['Q', 'T'], // Course Curriculum
  'C.g': ['Q', 'T'], // Faculty Profile
  'C.h': ['Q', 'T'], // Projected enrollees
  'C.i': ['Q', 'T'], // Preventive Maintenance Plan
  'C.j': ['Q', 'T'], // SIAS grades/grading sheets
  'C.k': ['Q', 'T'], // List of Top 10
  'C.l': ['Q', 'T'], // Delinquency Report
  'C.m': ['Q', 'T'], // Midterm Grades
  'C.n': ['Q', 'T'], // List of Dropped Students
  'C.o': ['Q', 'T'], // Final Class program
  'C.p': ['Q', 'T'], // Subject Load Notice
  'C.r': ['Q', 'T'], // HEI Data Collection
  'C.s': ['Q', 'T'], // Adding/dropping/changing subjects
  'C.t': ['Q', 'T'], // Enrolled and dropped students list
  'C.z': ['Q', 'T'], // Medical and dental supplies
  
  // CORE FUNCTIONS - Research Services
  '2.7.1': ['Q', 'E', 'T'], // Research outputs completed
  '2.7.2': ['Q', 'E', 'T'], // Researches completed on schedule
  '2.7.3.1': ['Q', 'E', 'T'], // Published in indexed journal
  '2.7.3.2': ['Q', 'E', 'T'], // Published in non-indexed journal
  '2.7.3.3': ['Q', 'E', 'T'], // Published in conference proceedings
  '2.7.3.4': ['Q', 'E', 'T'], // Presented in forums
  '2.7.3.6': ['Q', 'E', 'T'], // Research utilized
  '2.7.3.7': ['Q', 'E', 'T'], // Computer application utilized
  '2.7.3.8a': ['Q', 'E', 'T'], // Citations in refereed journal
  '2.7.3.8b': ['Q', 'E', 'T'], // Cited in book chapters
  
  // CORE FUNCTIONS - Extension Services
  '3.1.1': ['Q', 'E', 'T'], // Personnel involved in ESCE
  '3.1.2': ['Q', 'E', 'T'], // Students involved in ESCE
  '3.1.3': ['Q', 'E', 'T'], // Number of trainees
  '3.1.4': ['Q', 'E', 'T'], // Trained stakeholders
  '3.1.5a': ['Q', 'E', 'T'], // Trainings
  '3.1.5b': ['Q', 'E', 'T'], // Technology demonstrated
  '3.1.5c': ['Q', 'E', 'T'], // Technical advisory
  '3.1.5d': ['Q', 'E', 'T'], // Outreach
  
  // CORE FUNCTIONS - Production Services
  '4.1.1': ['Q', 'E', 'T'], // Faculty engaged in production
  '4.1.2': ['Q', 'E', 'T'], // Research-based production
  '4.2.1': ['Q', 'E', 'T'], // Students research commercialized
  '4.2.2': ['Q', 'E', 'T'], // Faculty research commercialized
  
  // SUPPORT FUNCTIONS - Client Satisfaction
  'CSM.a': ['Q', 'E'], // Very Satisfactory Rating
  'CSM.b': ['Q', 'E'], // No Negative Feedback
  
  // SUPPORT FUNCTIONS - Institutional Programs
  'S1.a': ['Q', 'E'], // Flag Ceremony attendance
  'S1.b': ['Q', 'E'], // Institutional programs attendance
  'S1.c': ['Q', 'E', 'T'], // OPCR review of targets
  'S1.d': ['Q', 'E', 'T'], // OPCR review of accomplishment
  'S1.e': ['Q', 'E', 'T'], // Health and wellness activities
  'S1.f': ['Q', 'E', 'T'], // GAD Planning and Budgeting
  'S1.g': ['Q', 'E', 'T'], // GAD-related activities
  'S1.h': ['Q', 'E'], // Officer of the Day
  
  // SUPPORT FUNCTIONS - Travels
  'S2.a': ['Q', 'E', 'T'], // L&D Report and Certificate
  
  // SUPPORT FUNCTIONS - Eco-friendly
  'S3.a': ['Q', 'E'], // Austerity measures
  'S3.b': ['Q', 'E', 'T'], // Health and environment projects
  'S3.c1': ['Q', 'E'], // Smoke-Free/Tobacco-Free
  'S3.c2': ['Q', 'E'], // Drug-Free Workplace
  'S3.c3': ['Q', 'E'], // Good Housekeeping
};

// Update the OPCR with required ratings
opcr.majorFunctions.forEach(mf => {
  if (mf.successIndicators) {
    mf.successIndicators.forEach(si => {
      const requiredRatings = requiredRatingsMap[si.code];
      if (requiredRatings) {
        si.requiredRatings = requiredRatings;
        console.log(`✓ Updated ${si.code}: ${requiredRatings.join(', ')}`);
      } else {
        console.log(`⚠ No mapping found for ${si.code}`);
      }
    });
  }
});

// Write the updated OPCR back to the file
fs.writeFileSync(opcrPath, JSON.stringify(opcr, null, 4), 'utf8');
console.log('\n✅ OPCR updated successfully with required ratings!');

export type ResourceLinks = {
  videos: { name: string; url: string }[];
  reading: { name: string; url: string }[];
  general: { name: string; url: string }[];
};

// this are "popular" majors that will send you a specific website that can help with those majors
const majorDictionary: Record<string, { name: string; urlPrefix: string }> = {
  "Business": { name: "Investopedia", urlPrefix: "https://www.google.com/search?q=site:investopedia.com+" },
  "Nursing": { name: "PubMed", urlPrefix: "https://pubmed.ncbi.nlm.nih.gov/?term=" },
  "Computer Science": { name: "GeeksforGeeks", urlPrefix: "https://www.google.com/search?q=site:geeksforgeeks.org+" },
  "Psychology": { name: "Simply Psychology", urlPrefix: "https://www.google.com/search?q=site:simplypsychology.org+" },
  "Engineering": { name: "Engineering ToolBox", urlPrefix: "https://www.google.com/search?q=site:engineeringtoolbox.com+" },
  "Biology": { name: "ScienceDirect", urlPrefix: "https://www.google.com/search?q=site:sciencedirect.com+" },
  "English": { name: "LitCharts", urlPrefix: "https://www.google.com/search?q=site:litcharts.com+" },
  "Criminal Justice": { name: "Cornell Law (LII)", urlPrefix: "https://www.google.com/search?q=site:law.cornell.edu+" },
  "Mass Communication": { name: "Nieman Lab", urlPrefix: "https://www.google.com/search?q=site:niemanlab.org+" },
  "Kinesiology": { name: "Physiopedia", urlPrefix: "https://www.google.com/search?q=site:physio-pedia.com+" },

};

export function generateResources(
  university: string, 
  major: string, 
  courseCode: string = "", // / Defaults to an empty string if Canvas didn't provide one
  title: string, 
  keywords: string[] = [] // Defaults to an empty string if OpenAI didn't provide one

): ResourceLinks {
    const searchTopic = keywords.length > 0 ? keywords.join(" ") : title; // If the AI found keywords join them with a space
                                                                        // If there are no keywords, just use the title of the assignment.
    const encodedTopic = encodeURIComponent(searchTopic);   // turns spaces into '%20' so the text is safe to put inside a web URL
    const courseUpper = courseCode.toUpperCase(); // this just converts the Canvas course code to uppercase 

    // Every single student gets these two links, no matter what class they are taking.
    let readingLinks = [
    { name: "Google Scholar", url: `https://scholar.google.com/scholar?q=${encodedTopic}` },
    { name: "Quizlet Flashcards", url: `https://quizlet.com/search?query=${encodedTopic}&type=sets` }
  ];

  let courseMatched = false; // We use this flag to stop the code from checking the next if blocks

  // Core Classes, we check if the course code includes common core subjects.
  // and provide links to useful websites that can help
  if (courseUpper.includes("MATH")) {

    // .unshift() adds this new link to the very top of the readingLinks array
    readingLinks.unshift({ name: "Wolfram Alpha", url: `https://www.wolframalpha.com/input/?i=${encodedTopic}` });
    courseMatched = true; // Mark as matched so we skip the next if blocks
  } 
  else if (courseUpper.includes("HIST") || courseUpper.includes("GOVT") || courseUpper.includes("POLS")) {
    readingLinks.unshift({ name: "JSTOR", url: `https://www.jstor.org/action/doBasicSearch?Query=${encodedTopic}` });
    readingLinks.unshift({ name: "History.com", url: `https://www.google.com/search?q=site:history.com+${encodedTopic}` });
    courseMatched = true;
  } 
  else if (courseUpper.includes("ENG") || courseUpper.includes("WRIT") || courseUpper.includes("LIT")) {
    readingLinks.unshift({ name: "Purdue OWL", url: `https://www.google.com/search?q=site:owl.purdue.edu+${encodedTopic}` });
    readingLinks.unshift({ name: "LitCharts", url: `https://www.google.com/search?q=site:litcharts.com+${encodedTopic}` });
    courseMatched = true;
  } 
  else if (courseUpper.includes("BIO") || courseUpper.includes("CHEM") || courseUpper.includes("PHYS")) { // this also works if the major is biology
    readingLinks.unshift({ name: "ScienceDaily", url: `https://www.google.com/search?q=site:sciencedaily.com+${encodedTopic}` });
    readingLinks.unshift({ name: "ScienceDirect", url: `https://www.google.com/search?q=site:sciencedirect.com+${encodedTopic}` });
    courseMatched = true;
  }
  // Major specifics courses, we can add more in the future or find a better way to do this?
  // Only runs if previous function didn't find a match

  
  if (!courseMatched) { // computer science courses
    if (courseUpper.includes("CS") || courseUpper.includes("CIS")) {
      readingLinks.unshift({ name: "GeeksforGeeks", url: `https://www.google.com/search?q=site:geeksforgeeks.org+${encodedTopic}` });
      readingLinks.unshift({ name: "Stack Overflow", url: `https://stackoverflow.com/search?q=${encodedTopic}` });
      courseMatched = true;
    } 
    else if (courseUpper.includes("NURS")) { // nursing courses
      readingLinks.unshift({ name: "PubMed", url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodedTopic}` });
      courseMatched = true;
    } 
    else if (courseUpper.includes("PSY") || courseUpper.includes("SOC")) { // psychology courses
      readingLinks.unshift({ name: "Simply Psychology", url: `https://www.google.com/search?q=site:simplypsychology.org+${encodedTopic}` });
      courseMatched = true;
    } 
    else if (courseUpper.includes("BUS") || courseUpper.includes("MGT") || courseUpper.includes("ACC") || courseUpper.includes("ECO")) { // business courses
      readingLinks.unshift({ name: "Investopedia", url: `https://www.google.com/search?q=site:investopedia.com+${encodedTopic}` });
      courseMatched = true;
    }
    else if (courseUpper.includes("ENGR") || courseUpper.includes("EE") || courseUpper.includes("ME")) { //  General, Electrical, and Mechanical Engineering courses

      readingLinks.unshift({ name: "Engineering ToolBox", url: `https://www.google.com/search?q=site:engineeringtoolbox.com+${encodedTopic}` });
      courseMatched = true;
    }
    else if (courseUpper.includes("CJ") || courseUpper.includes("LAW")) {  // Criminal Justice and Pre-Law courses
      readingLinks.unshift({ name: "Cornell Law (LII)", url: `https://www.google.com/search?q=site:law.cornell.edu+${encodedTopic}` });
      courseMatched = true;
    }
    else if (courseUpper.includes("MC") || courseUpper.includes("JOU") || courseUpper.includes("PR")) { // Mass Communication, Journalism, and Public Relations courses
      readingLinks.unshift({ name: "Nieman Lab", url: `https://www.google.com/search?q=site:niemanlab.org+${encodedTopic}` });
      courseMatched = true;
    }
    else if (courseUpper.includes("KIN") || courseUpper.includes("HHP")) { // Kinesiology and Health & Human Performance courses
      readingLinks.unshift({ name: "Physiopedia", url: `https://www.google.com/search?q=site:physio-pedia.com+${encodedTopic}` });
      courseMatched = true;
    }
  
  }
  // If the Canvas course code was empty or different from what we currently have above, we fall back to what the user set in their profile.
  if (!courseMatched) {

    // We search the majorDictionary keys to see if any of them exist inside the user's major string.
    // for example if major is "Bachelors of Nursing", it  matches the "Nursing" key from the majorDictionary function above
    const matchedUserMajor = Object.keys(majorDictionary).find(key => major.toLowerCase().includes(key.toLowerCase()));
    
    if (matchedUserMajor) {
      // Grab the URL prefix for that major and unshift it to the top.
      const site = majorDictionary[matchedUserMajor];
      readingLinks.unshift({ name: site.name, url: `${site.urlPrefix}${encodedTopic}` });
    }
  }

  // We package the custom reading links we just built alongside the universal Video and General search links.
  return {
    videos: [
      { name: "YouTube Tutorials", url: `https://www.youtube.com/results?search_query=${encodedTopic}` },
      { name: "CrashCourse / TED-Ed", url: `https://www.youtube.com/results?search_query=CrashCourse+OR+TED-Ed+${encodedTopic}` }
    ],
    reading: readingLinks,
    general: [
      // We also inject the university name into this Google search so it finds documents specific to their school or our school since we currently only have it hardcoded to txst
      { name: `${university} Context Search`, url: `https://www.google.com/search?q=${encodeURIComponent(`${university} ${searchTopic}`)}` },
      { name: "General Web Search", url: `https://www.google.com/search?q=${encodedTopic}` }
    ]
  };
}


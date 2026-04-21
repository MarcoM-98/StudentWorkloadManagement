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

}
/** The quiet moment after the last name on The List is crossed off. The game goes on; the story gets its breath. */
export const EPILOGUE_TITLE = "The Burn Is Lifted";

export const EPILOGUE: { who: string; text: string }[] = [
  {who: "Michael", text: "Every name is crossed off. For the first time since Nigeria nobody is hunting him, and the phone doesn't ring. He doesn't know what to do with his hands."},
  {who: "Fiona", text: "Fiona takes the afternoon off. Somewhere in the next county, a building is rumored to have had a bad day."},
  {who: "Sam", text: "Sam has opened a tab at every bar in Miami in Michael's name and is calling it a retirement plan."},
  {who: "Madeline", text: "Madeline hosts a dinner for forty. She's already planning the next one, and she isn't asking."},
  {who: "Nate's son, Charlie", text: "Charlie takes his first steps across the loft floor, straight toward a gadget he shouldn't touch. Nate is not looking. Michael is."},
];

export const EPILOGUE_CLOSE = "The burn is lifted, but Miami never closes. The phone rings. Somebody needs help.";

export const epilogueText = (): string => EPILOGUE.map(e => `${e.who}: ${e.text}`).join("\n\n") + "\n\n" + EPILOGUE_CLOSE;

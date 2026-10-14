/** The quiet moment after the last name on The List is crossed off. The game goes on; the story gets its breath. */
export const EPILOGUE_TITLE = "The Burn Is Lifted";

/** The lines for the Burn Lifted epilogue. Madeline's and Charlie's follow what the finale and Season 6 have done. */
export function epilogueEntries(madelineGone: boolean, nateGone: boolean): { who: string; text: string }[] {
  return [
    {who: "Michael", text: "Every name is crossed off. For the first time since Nigeria nobody is hunting him, and the phone doesn't ring. He doesn't know what to do with his hands."},
    {who: "Fiona", text: "Fiona takes the afternoon off. Somewhere in the next county, a building is rumored to have had a bad day."},
    {who: "Sam", text: "Sam has opened a tab at every bar in Miami in Michael's name and is calling it a retirement plan."},
    madelineGone
      ? {who: "Madeline", text: "Madeline's place at the table stays set. Nobody mentions it. Sam says grace badly, somebody lights a cigarette on the porch for her, and the kettle gets put on twice by mistake."}
      : {who: "Madeline", text: "Madeline sits on the porch with a cigarette and a cup of tea, and tells anyone who will listen that she always knew. Nobody argues. It is easier."},
    nateGone
      ? {who: "Charlie", text: "Charlie takes his first steps across the loft floor, straight toward a gadget he shouldn't touch. Michael is watching. He likes to think his brother is too."}
      : {who: "Nate's son, Charlie", text: "Charlie takes his first steps across the loft floor, straight toward a gadget he shouldn't touch. Nate is not looking. Michael is."},
  ];
}

export const EPILOGUE_CLOSE = "The burn is lifted, but Miami never closes. The phone rings. Somebody needs help.";

export const epilogueText = (madelineGone = false, nateGone = false): string =>
  epilogueEntries(madelineGone, nateGone).map(e => `${e.who}: ${e.text}`).join("\n\n") + "\n\n" + EPILOGUE_CLOSE;

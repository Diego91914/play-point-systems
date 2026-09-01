export type MysteryFollowupInterview = {
  questionerId: string;
  targetId: string;
  questionId: string;
};

type QuestionOption = { id: string; label: string; [key: string]: unknown };

type FollowupContext = {
  viewerId: string;
  targetId?: string;
  targetRoleId?: string;
  evidenceIndex: number;
  variantId?: string | null;
  asked: MysteryFollowupInterview[];
};

function roomPreviouslyAsked(context: FollowupContext, ids: string[]) {
  if (!context.targetId) return false;
  return context.asked.some(record => record.targetId === context.targetId && ids.includes(record.questionId));
}

function variantLabel(variantId: string | null | undefined, questionId: string, evidenceIndex: number) {
  if (variantId === "blackwood-business-partner") {
    const labels: Record<string, string> = {
      drink: "Now that physical evidence has appeared, what detail from dinner service could be misleading us?",
      glass: "Is there any innocent physical trace from earlier tonight that investigators could misread?",
      whiskey_owner: "Which physical clues belong to earlier innocent activity rather than the fatal confrontation?",
      door: "What do you know about movement between the study, rear hall, and kitchen side?",
      porch_route: "Could the rear route have connected the library back toward the study during the death window?",
      dark_jacket: "Who could have moved through the rear side of the house without being immediately recognized?",
      money: "What exactly was the current Blackwood Holdings money dispute?",
      old_money: "How is the old personal money dispute different from the current company problem?",
      ledger: "Does the blue ledger actually explain the missing Blackwood Holdings money?",
      ledger_entry: "What evidence points to the current company records rather than the old ledger?",
      final_pressure: "What fact about the company money dispute makes your story look worst now?",
    };
    return labels[questionId];
  }

  if (variantId === "blackwood-younger-sister") {
    const inheritancePaperKnown = evidenceIndex >= 1;
    const revisionKnown = evidenceIndex >= 3;
    const labels: Record<string, string> = {
      drink: "What ordinary dinner detail might distract us from the inheritance dispute?",
      glass: "Is there physical evidence from dinner that looks suspicious but may be unrelated?",
      whiskey_owner: "Which earlier physical clues could be real but irrelevant to the inheritance dispute?",
      door: "What do you know about movement between the rear entrance and the garden side?",
      porch_route: "Could someone have used the rear route to return outside during the death window?",
      dark_jacket: "Could the rear-side movement have been misidentified from outside?",
      money: "How much was really at stake in the inheritance dispute?",
      old_money: "How is the old financial dispute different from the inheritance fight?",
      ledger: revisionKnown
        ? "Does the blue ledger actually explain the changed inheritance documents?"
        : inheritancePaperKnown
          ? "Does the blue ledger actually explain the inheritance papers now in evidence?"
          : "Does the blue ledger actually explain tonight's inheritance dispute?",
      ledger_entry: revisionKnown
        ? "What evidence points to the revised inheritance papers rather than the old ledger?"
        : inheritancePaperKnown
          ? "What evidence connects the inheritance papers to tonight rather than the old ledger?"
          : "What evidence separates tonight's inheritance fight from the old ledger dispute?",
      final_pressure: revisionKnown
        ? "What fact about the inheritance revision makes your story look worst now?"
        : "What fact about the inheritance dispute makes your story look worst right now?",
    };
    return labels[questionId];
  }

  if (variantId === "blackwood-private-chef") {
    const householdChargesKnown = evidenceIndex >= 3;
    const labels: Record<string, string> = {
      drink: "Adrian's food and drink habits are now relevant. What do you know firsthand?",
      glass: "What was handled, rinsed, or cleaned in the kitchen after dinner?",
      whiskey_owner: "Which drink-related traces belong to guests, and which could come from kitchen cleanup?",
      door: "What do you know about movement through the kitchen-side rear entrance?",
      porch_route: "Could someone leave the library and return to the kitchen quickly by the rear route?",
      dark_jacket: "Was the movement near the kitchen side clear enough to identify clothing or a person?",
      money: householdChargesKnown
        ? "What financial damage could Adrian's household-account accusations cause?"
        : "What financial damage could losing Adrian as a client cause?",
      old_money: householdChargesKnown
        ? "How is the Old Friend's old dispute different from the Chef's household-account problem?"
        : "How is the Old Friend's old dispute different from the Chef's current employment conflict?",
      ledger: householdChargesKnown
        ? "Does the blue ledger actually explain the household-account charges?"
        : "Does the blue ledger actually explain the Chef's current dispute with Adrian?",
      ledger_entry: householdChargesKnown
        ? "What evidence points to the household service accounts rather than the old ledger?"
        : "What evidence points to tonight's service conflict rather than the old ledger?",
      final_pressure: householdChargesKnown
        ? "What fact about the household accounts makes your story look worst now?"
        : "What fact about the firing makes your story look worst right now?",
    };
    return labels[questionId];
  }

  return undefined;
}

function contradictionLabel(context: FollowupContext, questionId: string) {
  if (context.evidenceIndex < 2 || !roomPreviouslyAsked(context, ["where", "alibi", "timeline", "after"])) return undefined;

  if (context.variantId === "blackwood-business-partner" && context.targetRoleId === "partner") {
    if (questionId === "door" || questionId === "porch_route") return "CONTRADICTION: You said you stayed in the study. How do you explain the rear-route evidence tied to the company records?";
  }
  if (context.variantId === "blackwood-younger-sister" && context.targetRoleId === "sister") {
    if (questionId === "door" || questionId === "porch_route") return "CONTRADICTION: You said you stayed outside. How do you explain evidence that the rear route connects the library back toward the garden side?";
  }
  if (context.variantId === "blackwood-private-chef" && context.targetRoleId === "chef") {
    if (questionId === "door" || questionId === "porch_route") return "CONTRADICTION: You said you stayed in the kitchen. How do you explain the service gap and movement through the kitchen-side rear route?";
  }
  if ((!context.variantId || context.variantId === "blackwood-old-friend") && context.targetRoleId === "murderer") {
    if (questionId === "door" || questionId === "porch_route" || questionId === "dark_jacket") return "CONTRADICTION: You said you were in the bathroom. How do you explain the rear-route evidence during the same window?";
  }
  return undefined;
}

export function applyMysteryFollowupLabels<T extends QuestionOption[]>(questions: T, context: FollowupContext): T {
  return questions.map(question => {
    let label = contradictionLabel(context, question.id) ?? variantLabel(context.variantId, question.id, context.evidenceIndex) ?? question.label;

    if (!label.startsWith("CONTRADICTION:")) {
      if (question.id === "alibi" && roomPreviouslyAsked(context, ["where"])) {
        label = "Earlier you gave us your location. Who can actually verify you stayed there?";
      } else if (question.id === "timeline" && roomPreviouslyAsked(context, ["before", "after", "where"])) {
        label = "The death window is now 10:31–10:35. Walk us through those exact minutes again.";
      } else if (question.id === "relationship" && roomPreviouslyAsked(context, ["motive"])) {
        label = "Earlier you admitted tension with Adrian. How serious had that conflict really become?";
      } else if (question.id === "last_words" && roomPreviouslyAsked(context, ["victim"])) {
        label = "You already told us when you last saw Adrian. What exactly did he say during that encounter?";
      } else if (question.id === "library" && roomPreviouslyAsked(context, ["where", "heard"])) {
        label = "Given the confirmed death window, what do you know about activity around the library then?";
      } else if (question.id === "opportunity" && roomPreviouslyAsked(context, ["where"])) {
        label = "Your earlier location is on record. Could you physically have reached the library by 10:31–10:35?";
      }
    }

    // Follow-up status belongs to the interview history, not to the screen viewer.
    // This keeps the questioner, target, spectators, and saved Case File on one exact prompt.
    if (!label.startsWith("CONTRADICTION:") && roomPreviouslyAsked(context, ["where", "motive", "victim", "before", "after"]) && context.evidenceIndex >= 0) {
      if (question.id === "timeline") label = `FOLLOW-UP: ${label}`;
      if (question.id === "relationship") label = `FOLLOW-UP: ${label}`;
      if (question.id === "last_words") label = `FOLLOW-UP: ${label}`;
      if (question.id === "opportunity") label = `FOLLOW-UP: ${label}`;
    }

    return { ...question, label };
  }) as T;
}

export function followupLabelForQuestion(questionId: string, fallback: string, context: FollowupContext) {
  return applyMysteryFollowupLabels([{ id: questionId, label: fallback }], context)[0]?.label ?? fallback;
}

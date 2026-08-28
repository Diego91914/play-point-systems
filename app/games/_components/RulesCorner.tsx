"use client";

import { PhoneGameRules } from "@/app/games/_components/PhoneGameRules";
import type { PhoneGameRulesId } from "@/app/games/_components/PhoneGameRules";

export function RulesCorner({game}:{game:PhoneGameRulesId}){return <div className="fixed bottom-4 right-4 z-50"><PhoneGameRules game={game}/></div>}

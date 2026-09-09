import { randomUUID } from "node:crypto";
import { applyLiveCrapsRoomCommand, createStoredLiveCrapsRoom, getStoredLiveCrapsRoom, projectStoredLiveCrapsRoom, type LiveCrapsRoomCommand } from "./live-craps-room-store";
import type { LiveCrapsDiceMode } from "./live-craps-dice-mode";
import type { LiveCrapsBetKind } from "./live-craps-bets";
import type { LiveCrapsPoint } from "./live-craps";

const playerTokens=new Map<string,string>();
function roomPlayerKey(code:string,playerId:string){return `${code.trim().toUpperCase()}:${playerId}`;}
function issueToken(code:string,playerId:string){const token=randomUUID();playerTokens.set(roomPlayerKey(code,playerId),token);return token;}
function assertMember(code:string,playerId:string,token:string){if(!playerId.trim()||!token.trim())throw new Error("Live Craps player credentials are required.");const expected=playerTokens.get(roomPlayerKey(code,playerId));if(!expected||expected!==token)throw new Error("Live Craps player session is invalid.");getStoredLiveCrapsRoom(code);}
export function createLiveCrapsServerRoom(input:{code:string;hostPlayerId:string;hostName:string;diceMode?:LiveCrapsDiceMode}){const stored=createStoredLiveCrapsRoom(input);const token=issueToken(stored.room.code,input.hostPlayerId);return{code:stored.room.code,playerId:input.hostPlayerId,token,state:projectStoredLiveCrapsRoom(stored.room.code,input.hostPlayerId)};}
export function joinLiveCrapsServerRoom(code:string,input:{playerId:string;name:string}){const token=issueToken(code,input.playerId);try{applyLiveCrapsRoomCommand(code,`join-${input.playerId}`,{type:"join",playerId:input.playerId,name:input.name});}catch(error){playerTokens.delete(roomPlayerKey(code,input.playerId));throw error;}return{code:code.trim().toUpperCase(),playerId:input.playerId,token,state:projectStoredLiveCrapsRoom(code,input.playerId)};}
export async function getLiveCrapsRoom(code:string,playerId:string,token:string){assertMember(code,playerId,token);return{state:projectStoredLiveCrapsRoom(code,playerId)};}
function point(value:unknown):LiveCrapsPoint|undefined{const n=Number(value);return [4,5,6,8,9,10].includes(n)?n as LiveCrapsPoint:undefined;}
function betKind(value:unknown):LiveCrapsBetKind{if(value==="pass-line"||value==="dont-pass"||value==="field"||value==="place")return value;throw new Error("Unsupported Standard Table bet.");}
function strings(value:unknown){return Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"&&item.length>0):[];}
function requiredString(value:unknown,label:string){if(typeof value!=="string"||!value.trim())throw new Error(`${label} is required.`);return value.trim();}
function commandFromAction(playerId:string,action:string,payload:Record<string,unknown>):LiveCrapsRoomCommand{
 if(action==="start")return{type:"start",actorPlayerId:playerId};
 if(action==="tick")return{type:"tick"};
 if(action==="place-bet")return{type:"place-bet",actorPlayerId:playerId,kind:betKind(payload.kind),amount:Number(payload.amount),number:point(payload.number),betId:typeof payload.betId==="string"?payload.betId:undefined};
 if(action==="place-come"){if(payload.kind!=="come"&&payload.kind!=="dont-come")throw new Error("Come wager kind is invalid.");return{type:"place-come",actorPlayerId:playerId,kind:payload.kind,amount:Number(payload.amount),betId:typeof payload.betId==="string"?payload.betId:undefined};}
 if(action==="place-odds")return{type:"place-odds",actorPlayerId:playerId,parentBetId:requiredString(payload.parentBetId,"parentBetId"),amount:Number(payload.amount),oddsId:typeof payload.oddsId==="string"?payload.oddsId:undefined};
 if(action==="undo-bet")return{type:"undo-bet",actorPlayerId:playerId,betId:requiredString(payload.betId,"betId")};
 if(action==="clear-new-bets")return{type:"clear-new-bets",actorPlayerId:playerId,betIds:strings(payload.betIds)};
 if(action==="begin-roll")return{type:"begin-roll",actorPlayerId:playerId};
 if(action==="settle-physical")return{type:"settle-physical",actorPlayerId:playerId,die1:Number(payload.die1),die2:Number(payload.die2)};
 if(action==="settle-virtual")return{type:"settle-virtual",actorPlayerId:playerId};
 if(action==="close")return{type:"close",actorPlayerId:playerId};
 throw new Error("Unsupported Live Craps action.");
}
export async function actLiveCrapsRoom(code:string,playerId:string,token:string,commandId:string,action:string,payload:Record<string,unknown>={}){assertMember(code,playerId,token);applyLiveCrapsRoomCommand(code,commandId,commandFromAction(playerId,action,payload));return{state:projectStoredLiveCrapsRoom(code,playerId)};}

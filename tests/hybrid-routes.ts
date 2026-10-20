import type { TalentId } from '../src/content/talents';
import type { UpgradeId } from '../src/content/upgrades';
export const RUN_ROUTES: {name:string;talents:TalentId[];priority:UpgradeId[]}[]=[
{name:'retaliation',talents:['reprisal','sweeping-blade','spellsteel','frostbreak','iron-ward','last-stand','communion','searing-grace'],priority:['riposte','longblade','icebrand','aegis','wellspring','benediction']},
{name:'frost/melee',talents:['reprisal','sweeping-blade','frostbreak','arcane-echo','rime-sigil','shatterglass','communion','searing-grace'],priority:['longblade','icebrand','aegis','riposte','wellspring','benediction']},
{name:'critical/DoT',talents:['expose-weakness','venom-edge','killer-instinct','siphon-toxin','contagion','nightfall','communion','searing-grace'],priority:['catalyst','precision','potency','venom','wellspring','aegis']},
{name:'healing/offense',talents:['communion','searing-grace','sanctuary','atonement','martyr-ward','dawn-chorus','reprisal','sweeping-blade'],priority:['benediction','wellspring','aegis','riposte','longblade']},
{name:'summons',talents:['hunting-momentum','falcon','pack-link','soul-cinder','grim-pact','agony','communion','searing-grace'],priority:['familiar','icebrand','frost-pact','potency','venom','wellspring','aegis']},
];

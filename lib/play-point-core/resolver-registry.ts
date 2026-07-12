import type {
  ContestFormatKey,
  ContestResolver,
  ResolverRegistry,
} from "./runtime-contracts";

export class StaticResolverRegistry implements ResolverRegistry {
  private readonly resolversByFormat = new Map<ContestFormatKey, ContestResolver>();

  constructor(resolvers: ContestResolver[]) {
    for (const resolver of resolvers) {
      for (const formatKey of SUPPORTED_FORMATS) {
        if (resolver.supports(formatKey)) {
          this.resolversByFormat.set(formatKey, resolver);
        }
      }
    }
  }

  getResolver(formatKey: ContestFormatKey): ContestResolver {
    const resolver = this.resolversByFormat.get(formatKey);

    if (!resolver) {
      throw new Error(`No resolver registered for contest format "${formatKey}".`);
    }

    return resolver;
  }
}

const SUPPORTED_FORMATS: readonly ContestFormatKey[] = [
  "winner_pick",
  "final_score",
  "football_squares",
  "driver_shuffle",
  "driver_franchise",
  "bracket_pick",
  "over_under",
  "custom_question",
] as const;

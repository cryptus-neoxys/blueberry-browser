import { pipeline, Pipeline } from "@xenova/transformers";

type EmbeddingPipeline = Pipeline<"feature-extraction">;

export class EmbeddingService {
  private static instance: EmbeddingService | null = null;
  private embeddingPromise: Promise<EmbeddingPipeline> | null = null;

  private constructor() {
    // Use getInstance() for singleton access
  }

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  private async getEmbeddingPipeline(): Promise<EmbeddingPipeline> {
    if (!this.embeddingPromise) {
      this.embeddingPromise = pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      ) as Promise<EmbeddingPipeline>;
    }
    return this.embeddingPromise;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const extractor = await this.getEmbeddingPipeline();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    const data = Array.isArray(output.data) ? output.data : [];
    return data as number[];
  }
}

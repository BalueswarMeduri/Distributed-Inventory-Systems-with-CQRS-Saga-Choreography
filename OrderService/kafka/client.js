import { Kafka, Partitioners } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";

export const kafka = new Kafka({
  clientId: "order-service",
  brokers: [kafkaBroker],
  retry: {
    initialRetryTime: 300,
    retries: 5,
  },
});

export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

/**
 * Ensure required topics exist in Kafka broker
 */
export const initKafkaTopics = async (topics = ["order-events"]) => {
  const admin = kafka.admin();
  try {
    await admin.connect();
    const existingTopics = await admin.listTopics();
    const topicsToCreate = topics
      .filter((t) => !existingTopics.includes(t))
      .map((t) => ({
        topic: t,
        numPartitions: 1,
        replicationFactor: 1,
      }));

    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
      console.log(`Kafka topics created: ${topicsToCreate.map((t) => t.topic).join(", ")}`);
    } else {
      console.log(`All required Kafka topics already exist: ${topics.join(", ")}`);
    }
  } catch (error) {
    console.error("Error creating Kafka topics:", error.message);
  } finally {
    await admin.disconnect();
  }
};

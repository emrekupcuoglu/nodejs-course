// ?STREAMS
// Streams are used to process (read and write) data piece by piece
// without completing the whole read or write operation,
// and therefore without keeping all the data in memory.
// For example when we read a file using streams
// we read part of the data do something with it
// then free our memory and repeat this until the entire files has been processed.

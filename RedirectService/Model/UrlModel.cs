using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace RedirectService.Models
{
    public class UrlModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("urlCode")]
        public string UrlCode { get; set; }

        [BsonElement("longUrl")]
        public string LongUrl { get; set; }

        [BsonElement("shortUrl")]
        public string ShortUrl { get; set; }

        [BsonElement("clicks")]
        public int Clicks { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }

        [BsonElement("expiresAt")]
        public DateTime ExpiresAt { get; set; }

        // Add the __v field that Mongoose adds automatically
        [BsonElement("__v")]
        public int Version { get; set; }

        // Ignore any unknown elements during deserialization
       
    }
}
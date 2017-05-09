class Catalog
  include DataMapper::Resource

  property :id,         Serial
  property :book_id,    Integer
  property :catalog_id, Integer
  property :title,      String
  property :src,        String

  belongs_to :book
end
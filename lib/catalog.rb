class Catalog
  include DataMapper::Resource

  property :id,         Serial
  property :book_id,    Integer,    :index => :index_books_on_catalogs_id
  property :catalog_id, Integer
  property :title,      String
  property :src,        String

  belongs_to :book
end
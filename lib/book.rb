class Book
  include DataMapper::Resource

  property :id,         Serial
  property :title,      String
  property :author,     String
  property :description,String,     :default  => '',        :length => 500
  property :category_id,Integer,    :index => :index_books_on_category_id
  property :close,      Integer,    :default  => 0
  property :views,      Integer,    :default  => 0

  has n, :catalogs
  belongs_to :category
end
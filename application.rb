require "rubygems"
require "bundler/setup"
require "sinatra"
require 'sinatra/reloader'
require 'net/http'
require 'open-uri'
require 'nokogiri'
require 'dm-serializer'
require File.join(File.dirname(__FILE__), "environment")

configure do
  set :views, "#{File.dirname(__FILE__)}/views"
  set :show_exceptions, :after_handler
end

configure :production, :development do
  enable :logging
end

helpers do
  # add your helpers here
end

# root page
get '/' do
  erb :index
end

get '/search.html' do
  key = params['key']
  if key==''
    @title = '完本小说'
    @books = Book.all(:close => 1)
  else
    @title = "search: `#{key}`"
    @books = Book.all(:title.like => "%#{key}%")
  end
  erb :books
end

get '/books.html' do
  @books = Book.all
  erb :books
end
get '/books.json' do
  books = Book.all
  books.to_json
end

get '/:book_id.html' do
  @book = Book.get(params['book_id'].to_i)
  erb :catalogs
end

get '/:book_id/:catalog_id.html' do
  @catalog = Catalog.first(:book_id => params['book_id'].to_i , :catalog_id => params['catalog_id'].to_i)

  doc = Nokogiri::HTML(open(@catalog.src), nil, 'UTF-8')
  n = doc.css('div#content')[0]
  n.search('script').remove
  @content = n.inner_html.gsub!('<br>　　<br>', '<br>')

  @next_catalog = Catalog.first(:book_id => params['book_id'].to_i , :catalog_id.gt => params['catalog_id'].to_i)
  @prev_catalog = Catalog.last(:book_id => params['book_id'].to_i , :catalog_id.lt => params['catalog_id'].to_i)

  html = erb :detail

  cache_file = "#{File.dirname(__FILE__)}/public/#{params['book_id']}/#{params['catalog_id']}.html"
  cache_dir = "#{File.dirname(__FILE__)}/public/#{params['book_id']}"
  if !Dir.exist?(cache_dir)
    Dir.mkdir(cache_dir)
  end
  if !File.exist?(cache_file) #|| (File.mtime(cache_file) < (Time.now - 3600*24*5))
    File.open(cache_file,'w'){ |f| f << html }
  end

  html
end
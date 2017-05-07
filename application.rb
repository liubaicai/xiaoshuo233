require "rubygems"
require "bundler/setup"
require "sinatra"
require 'net/http'
require 'open-uri'
require 'nokogiri'
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

target_host = 'www.biquge.co'
# p = params['splat'][0]
# src = Net::HTTP.get(target_host, "/#{p}")
# html = src.encode('utf-8','gb18030')
# html

# root page
get '/' do
  url = 'http://www.biquge.co/xiaoshuodaquan/'
  doc = Nokogiri::HTML(open(url), nil, "GB18030")
  nodes = doc.css('div.novellist li')
  nodes.to_s.encode("UTF-8")
end

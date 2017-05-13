require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'sinatra/reloader'
require 'dotenv'
require 'dotenv/load'

require 'dm-core'
require 'dm-timestamps'
require 'dm-validations'
require 'dm-aggregates'
require 'dm-migrations'
require 'dm-serializer'

require 'ostruct'
require 'net/http'
require 'open-uri'
require 'nokogiri'

require 'will_paginate'
require 'will_paginate/data_mapper'
require 'will_paginate-bootstrap'

require 'sinatra' unless defined?(Sinatra)

require 'rufus-scheduler'

Dotenv.load

configure do
  SiteConfig = OpenStruct.new(
                 :site_name => '小说有读',
                 :title => '小说有读_清爽无弹窗广告的网络小说阅读网',
                 :author => 'powered by liubaicai',
                 :url_base => 'http://www.xiaoshuoyoudu.com/',
                 :keywords => '小说有读,无弹窗,笔趣阁,小说',
                 :description => '小说有读是广大书友最值得收藏的网络小说阅读网，网站收录了当前最火热的网络小说，免费提供高质量的小说最新章节，是广大网络小说爱好者必备的小说阅读网。'
               )

  # load models
  $LOAD_PATH.unshift("#{File.dirname(__FILE__)}/lib")
  Dir.glob("#{File.dirname(__FILE__)}/lib/*.rb") { |lib| require File.basename(lib, '.*') }

  #DataMapper.setup(:default, (ENV["DATABASE_URL"] || "sqlite3:///#{File.expand_path(File.dirname(__FILE__))}/#{Sinatra::Base.environment}.db"))
  DataMapper.setup(:default, (ENV["DATABASE_URL"] || "sqlite3:///#{File.expand_path(File.dirname(__FILE__))}/dushu233.sqlite"))
  DataMapper.finalize
  DataMapper.auto_upgrade!
end

$LOAD_PATH.unshift("#{File.dirname(__FILE__)}/config")
Dir.glob("#{File.dirname(__FILE__)}/config/*.rb") { |config| require File.basename(config, '.*') }
#coding: utf-8

scheduler = Rufus::Scheduler.new
scheduler.every '1m' do

  begin

    unless File.exist?("#{File.dirname(__FILE__)}/../script/dushu233.pid")
      `ruby #{File.dirname(__FILE__)}/../script/dushu233.rb &`
    end

  end

end
# scheduler.join
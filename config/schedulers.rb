#coding: utf-8

scheduler = Rufus::Scheduler.singleton
scheduler.cron '0 0 0 * * 1,4' do

  begin

    if File.exist?("#{File.dirname(__FILE__)}/../script/dushu233.pid")
      `ruby #{File.dirname(__FILE__)}/../script/dushu233.rb exit`
      sleep(1)
    end
    `ruby #{File.dirname(__FILE__)}/../script/dushu233.rb`

  end

end

# nginx.conf：
#
# passenger_spawn_method direct;
# passenger_min_instances 1;
# passenger_pool_idle_time 0;
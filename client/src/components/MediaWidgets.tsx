import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function MediaWidgets() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-sky-900 mb-4">📻 Media Center</h2>
        <p className="text-sky-700 text-lg">
          Enjoy our curated music and radio content while you read
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Spotify Widget */}
        <Card className="border-sky-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-sky-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🎵</span>
                </div>
                <div>
                  <CardTitle className="text-sky-900">Spotify Playlist</CardTitle>
                  <CardDescription className="text-sky-600">
                    Our curated reading music
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-green-500 text-white">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-lg p-8 text-center">
              {/* Spotify Embed Placeholder - Replace with actual Spotify embed */}
              <div className="space-y-4">
                <div className="text-4xl mb-4">🎵</div>
                <h3 className="text-lg font-semibold text-sky-900">
                  Tangan Terbuka Media Playlist
                </h3>
                <p className="text-sky-600">
                  Perfect background music for reading our blog posts and browsing books
                </p>
                <div className="space-y-2 text-sm text-sky-600">
                  <p>🎶 Ambient & Lo-fi tracks</p>
                  <p>🎹 Instrumental focus music</p>
                  <p>🌊 Peaceful nature sounds</p>
                </div>
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white mt-4"
                  onClick={() => window.open('https://open.spotify.com/', '_blank')}
                >
                  🎵 Open in Spotify
                </Button>
              </div>
              
              {/* Uncomment and replace with your actual Spotify playlist embed */}
              {/*
              <iframe 
                src="https://open.spotify.com/embed/playlist/YOUR_PLAYLIST_ID" 
                width="100%" 
                height="380" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="rounded-lg"
              ></iframe>
              */}
            </div>
            
            <div className="mt-4 text-xs text-sky-600 text-center">
              <p>💡 <strong>Admin Note:</strong> Replace the placeholder with your actual Spotify playlist embed code</p>
            </div>
          </CardContent>
        </Card>

        {/* Radio Widget */}
        <Card className="border-sky-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-sky-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📻</span>
                </div>
                <div>
                  <CardTitle className="text-sky-900">Live Radio Stream</CardTitle>
                  <CardDescription className="text-sky-600">
                    24/7 online radio station
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <Badge className="bg-red-500 text-white">Live</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-lg p-8 text-center">
              {/* Radio Stream Placeholder - Replace with actual radio embed */}
              <div className="space-y-4">
                <div className="text-4xl mb-4">📻</div>
                <h3 className="text-lg font-semibold text-sky-900">
                  Tangan Terbuka Radio
                </h3>
                <p className="text-sky-600">
                  Listen to our live radio stream with talk shows, music, and book discussions
                </p>
                
                {/* Mock Radio Player */}
                <div className="bg-white p-4 rounded-lg border border-red-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sky-900 font-medium">🎙️ Now Playing</span>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      On Air
                    </Badge>
                  </div>
                  <p className="text-sky-700">Morning Book Discussion</p>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                      ▶️ Play
                    </Button>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-red-500 rounded-full w-1/3 animate-pulse"></div>
                    </div>
                    <span className="text-sm text-sky-600">🔊</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-sky-600">
                  <p>🎙️ Live talk shows</p>
                  <p>📚 Book reviews & discussions</p>
                  <p>🎶 Curated music selection</p>
                </div>

                <Button 
                  className="bg-red-500 hover:bg-red-600 text-white mt-4"
                  onClick={() => alert('Radio stream integration coming soon!')}
                >
                  📻 Listen Live
                </Button>
              </div>
              
              {/* Uncomment and replace with your actual radio stream embed */}
              {/*
              <audio 
                controls 
                className="w-full"
                src="YOUR_RADIO_STREAM_URL"
              >
                Your browser does not support the audio element.
              </audio>
              */}
            </div>
            
            <div className="mt-4 text-xs text-sky-600 text-center">
              <p>💡 <strong>Admin Note:</strong> Replace the placeholder with your actual radio stream embed or player</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Card */}
      <Card className="border-sky-200 shadow-lg">
        <CardHeader className="bg-sky-50">
          <CardTitle className="text-sky-900 flex items-center">
            📅 Programming Schedule
          </CardTitle>
          <CardDescription className="text-sky-600">
            Catch your favorite shows at the right time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { time: '07:00 - 09:00', show: '🌅 Morning Book Club', desc: 'Start your day with book discussions' },
              { time: '12:00 - 14:00', show: '☀️ Midday Music', desc: 'Relaxing tunes for your lunch break' },
              { time: '18:00 - 20:00', show: '🌆 Evening Talks', desc: 'Author interviews and literary discussions' },
              { time: '21:00 - 23:00', show: '🌙 Night Reads', desc: 'Peaceful music for late-night reading' },
              { time: 'Weekend', show: '📚 Book Reviews', desc: 'Comprehensive book reviews and recommendations' },
              { time: 'Special Events', show: '🎉 Live Sessions', desc: 'Author readings and community events' }
            ].map((program, index) => (
              <div key={index} className="bg-sky-50 p-4 rounded-lg border border-sky-200">
                <div className="font-semibold text-sky-900 text-sm">{program.time}</div>
                <div className="font-medium text-sky-800 mt-1">{program.show}</div>
                <div className="text-sky-600 text-xs mt-1">{program.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Instructions */}
      <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center">
            🔧 Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-yellow-700">
            <div>
              <h4 className="font-semibold">Spotify Integration:</h4>
              <p className="text-sm">
                1. Create a playlist on Spotify<br/>
                2. Get the embed code from Spotify<br/>
                3. Replace the placeholder in the Spotify widget section
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Radio Integration:</h4>
              <p className="text-sm">
                1. Set up your radio streaming service<br/>
                2. Get the stream URL or embed code<br/>
                3. Replace the placeholder in the Radio widget section
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}